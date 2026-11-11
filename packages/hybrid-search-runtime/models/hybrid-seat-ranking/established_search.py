"""Read-only dense, FTS5 BM25, and reciprocal-rank field retrieval primitives.

The module owns no model downloads, persistence, training, checkpoints, or live
catalog refresh. Callers provide normalized field vectors or an encoder callable.
"""
from __future__ import annotations

import re
import sqlite3
from collections.abc import Callable, Sequence

import numpy as np

FIELDS = ('name', 'title', 'description')
DEFAULT_FIELD_WEIGHTS = {'name': 2.0, 'title': 1.5, 'description': 1.25}
RRF_K = 60
_STOPWORDS = frozenset('''a an and are as at be can do does for from how i in is it of on or please show the this to what where which with'''.split())


def lexical_tokens(text: str) -> list[str]:
    """Split camelCase and punctuation consistently before FTS query quoting."""
    spaced = re.sub(r'([a-z0-9])([A-Z])', r'\1 \2', text)
    return [word for word in re.findall(r'[^\W_]+', spaced.casefold(), flags=re.UNICODE)
            if word not in _STOPWORDS]


def _normalise(values: np.ndarray) -> np.ndarray:
    values = np.asarray(values, dtype=np.float32)
    if values.ndim != 2:
        raise ValueError('Encoder output must be a 2D matrix')
    if not np.isfinite(values).all():
        raise ValueError('Encoder output must contain only finite values')
    norms = np.linalg.norm(values, axis=1, keepdims=True)
    return np.divide(values, norms, out=np.zeros_like(values), where=norms > 1e-12)


def _competition_ranks(scores: np.ndarray, eligible: np.ndarray, descending: bool) -> np.ndarray:
    """Return one-based competition ranks; ineligible rows have rank zero."""
    ranks = np.zeros(len(scores), dtype=np.int32)
    indexes = np.flatnonzero(eligible)
    if not len(indexes):
        return ranks
    ordered = indexes[np.argsort(-scores[indexes] if descending else scores[indexes], kind='stable')]
    prior = None
    rank = 0
    for position, index in enumerate(ordered, start=1):
        score = float(scores[index])
        if prior is None or score != prior:
            rank = position
            prior = score
        ranks[index] = rank
    return ranks


class FieldRetriever:
    """Score catalog records from per-field dense cosine and SQLite FTS5 BM25.

    `encode` must encode a list of strings into a 2D NumPy-compatible matrix.
    Supplied `vectors`, or vectors generated once at construction, are cached for
    this instance and must correspond to catalog order and FIELDS order.

    `bm25` and `dense` methods use weighted reciprocal ranks from one channel;
    `rrf` sums both channel reciprocal ranks. Raw SQLite BM25 values are returned
    only as diagnostics and are never added to cosine values or rank scores.
    """
    def __init__(self, catalog: Sequence[dict], encode: Callable[[list[str]], np.ndarray],
                 field_weights: dict[str, float] | None = None,
                 vectors: np.ndarray | None = None, include_type: bool = False):
        self.catalog = list(catalog)
        self.encode = encode
        weights = dict(DEFAULT_FIELD_WEIGHTS)
        if field_weights is not None:
            unknown = set(field_weights) - (set(FIELDS) | {'type'})
            if unknown:
                raise ValueError(f'Unknown field weight(s): {sorted(unknown)}')
            weights.update(field_weights)
        if any(not isinstance(value, (int, float)) or not np.isfinite(value) or value < 0
               for value in weights.values()):
            raise ValueError('Field weights must be finite, nonnegative numbers')
        if 'type' in weights and not include_type:
            raise ValueError("A type weight requires include_type=True")
        self.include_type = bool(include_type)
        self.type_weight = float(weights.get('type', 1.0)) if self.include_type else 0.0
        self.field_weights = np.asarray([weights[field] for field in FIELDS], dtype=np.float32)
        self.texts = [[str(record.get(field, '') or '') for field in FIELDS]
                      for record in self.catalog]
        self.tokens = [[lexical_tokens(value) for value in row] for row in self.texts]
        flattened = [value for row in self.texts for value in row]
        expected = (len(self.catalog), len(FIELDS))
        if vectors is None:
            encoded = np.asarray(encode(flattened), dtype=np.float32)
            if encoded.ndim != 2 or encoded.shape[0] != len(flattened):
                raise ValueError('Encoder must return one vector per catalog field')
            encoded = _normalise(encoded)
            for index, value in enumerate(flattened):
                if not value.strip():
                    encoded[index] = 0
            self.vectors = encoded.reshape(*expected, encoded.shape[1])
        else:
            supplied = np.asarray(vectors, dtype=np.float32)
            if supplied.ndim != 3 or supplied.shape[:2] != expected:
                raise ValueError(f'Vectors must have shape (records, {len(FIELDS)}, dimensions)')
            if not np.isfinite(supplied).all():
                raise ValueError('Vectors must contain only finite values')
            self.vectors = _normalise(supplied.reshape(-1, supplied.shape[-1])).reshape(supplied.shape)
            for index, value in enumerate(flattened):
                if not value.strip():
                    self.vectors.reshape(-1, self.vectors.shape[-1])[index] = 0
        self.types = [str(record.get('type', '') or '') for record in self.catalog]
        self.type_tokens = [lexical_tokens(value) for value in self.types]
        self.type_labels = [' '.join(tokens) for tokens in self.type_tokens]
        self.unique_types = list(dict.fromkeys(value for value in self.type_labels if value))
        self.unique_type_tokens = [lexical_tokens(value) for value in self.unique_types]
        self.type_vectors = np.zeros((len(self.unique_types), self.vectors.shape[-1]), dtype=np.float32)
        self.type_index = {value: index for index, value in enumerate(self.unique_types)}
        if self.include_type and self.unique_types:
            encoded_types = _normalise(np.asarray(encode(self.unique_types), dtype=np.float32))
            if encoded_types.shape != self.type_vectors.shape:
                raise ValueError('Encoder must return one correctly-sized vector per unique type')
            self.type_vectors[:] = encoded_types
        self._fts = sqlite3.connect(':memory:')
        self._fts.row_factory = sqlite3.Row
        try:
            for field_index, field in enumerate(FIELDS):
                table = f'fts_{field}'
                self._fts.execute(
                    f'CREATE VIRTUAL TABLE {table} USING fts5(record_index UNINDEXED, content, tokenize="unicode61 remove_diacritics 2")')
                self._fts.executemany(
                    f'INSERT INTO {table}(record_index,content) VALUES(?,?)',
                    [(index, ' '.join(self.tokens[index][field_index]))
                     for index, row in enumerate(self.texts)
                     if self.tokens[index][field_index]])
            self._fts.commit()
        except sqlite3.OperationalError as error:
            self._fts.close()
            raise RuntimeError('SQLite was built without the FTS5 extension') from error

    def close(self) -> None:
        self._fts.close()

    def score_all(self, query: str, qvector: np.ndarray | None = None,
                  method: str = 'rrf', semantic_override: np.ndarray | None = None,
                  suppressed: np.ndarray | None = None,
                  training_evidence: np.ndarray | None = None) -> dict[str, np.ndarray | list]:
        """Return numeric matrices (records x fields) and weighted totals."""
        if method not in ('bm25', 'dense', 'rrf'):
            raise ValueError("method must be 'bm25', 'dense', or 'rrf'")
        from search_telemetry import Timeline
        clock=Timeline()
        count = len(self.catalog)
        shape = (count, len(FIELDS))
        raw_bm25 = np.zeros(shape, dtype=np.float32)
        lexical_rank = np.zeros(shape, dtype=np.int32)
        semantic = np.zeros(shape, dtype=np.float32)
        semantic_rank = np.zeros(shape, dtype=np.int32)
        matched = np.zeros(shape, dtype=bool)
        suppressed_mask = np.zeros(shape, dtype=bool) if suppressed is None else np.asarray(suppressed, dtype=bool)
        if suppressed_mask.shape != shape:
            raise ValueError(f'Suppressed mask must have shape {shape}')
        override = None if semantic_override is None else np.asarray(semantic_override, dtype=np.float32)
        if override is not None and (override.shape != shape or not np.isfinite(override).all()):
            raise ValueError(f'Semantic override must be a finite matrix with shape {shape}')
        matched_words = [[[] for _ in FIELDS] for _ in self.catalog]
        query_words = lexical_tokens(query)
        query_set = set(query_words)
        for record_index, row in enumerate(self.tokens):
            for field_index, words in enumerate(row):
                matched_words[record_index][field_index] = sorted(query_set.intersection(words))
        if query_words:
            # Every token is quoted independently; FTS syntax never receives raw user text.
            expression = ' OR '.join('"' + token.replace('"', '""') + '"' for token in query_words)
            for field_index, field in enumerate(FIELDS):
                table = f'fts_{field}'
                results = self._fts.execute(
                    f'SELECT record_index,bm25({table}) AS score FROM {table} '
                    f'WHERE {table} MATCH ? ORDER BY score ASC,record_index ASC',
                    (expression,)).fetchall()
                values = np.zeros(count, dtype=np.float64)
                eligible = np.zeros(count, dtype=bool)
                for result in results:
                    index = int(result['record_index'])
                    eligible[index] = True
                    values[index] = float(result['score'])
                    matched[index, field_index] = True
                raw_bm25[:, field_index] = values
                lexical_rank[:, field_index] = _competition_ranks(values, eligible, descending=False)
        clock.mark("Keyword matching")
        # Preserve actual query wording for semantic encoding; lexical stopwords do not apply.
        if query.strip() and count:
            if qvector is None:
                query_matrix = _normalise(np.asarray(self.encode([query]), dtype=np.float32))
                if query_matrix.shape[0] != 1 or query_matrix.shape[1] != self.vectors.shape[-1]:
                    raise ValueError('Query encoder dimension does not match catalog vectors')
                qv = query_matrix[0]
            else:
                qv = np.asarray(qvector, dtype=np.float32).reshape(-1)
                if qv.shape[0] != self.vectors.shape[-1] or not np.isfinite(qv).all():
                    raise ValueError('Query vector dimension must match catalog vectors')
                norm = float(np.linalg.norm(qv))
                qv = qv / norm if norm > 1e-12 else np.zeros_like(qv)
            semantic = np.einsum('nfd,d->nf', self.vectors, qv, optimize=True)
            semantic = np.maximum(semantic, 0).astype(np.float32)
            retrieval_semantic = semantic.copy()
            if override is not None:
                retrieval_semantic = np.maximum(override, 0)
            for field_index in range(len(FIELDS)):
                eligible = np.array([bool(text.strip()) for text in (row[field_index] for row in self.texts)]) & (retrieval_semantic[:, field_index] > 0)
                semantic_rank[:, field_index] = _competition_ranks(retrieval_semantic[:, field_index], eligible, descending=True)
        else:
            retrieval_semantic = semantic.copy()
        clock.mark("Semantic matching")
        # Approved field feedback can alter or suppress ranking channels without
        # overwriting the original semantic diagnostic returned to the caller.
        lexical_rank[suppressed_mask] = 0
        semantic_rank[suppressed_mask] = 0
        raw_bm25[suppressed_mask] = 0
        matched[suppressed_mask] = False
        retrieval_semantic[suppressed_mask] = 0
        lexical_component = np.divide(1.0, RRF_K + lexical_rank, out=np.zeros(shape, dtype=np.float32), where=lexical_rank > 0)
        semantic_component = np.divide(1.0, RRF_K + semantic_rank, out=np.zeros(shape, dtype=np.float32), where=semantic_rank > 0)
        if method == 'bm25':
            field_scores = lexical_component
        elif method == 'dense':
            field_scores = semantic_component
        else:
            field_scores = lexical_component + semantic_component
        training_rank = np.zeros(shape,dtype=np.int32)
        if training_evidence is not None:
            learned=np.asarray(training_evidence,dtype=np.float32)
            if learned.shape!=shape or not np.isfinite(learned).all() or np.any(learned<0):
                raise ValueError(f'Training evidence must be finite nonnegative scores of shape {shape}')
            for f in range(len(FIELDS)):
                training_rank[:,f]=_competition_ranks(learned[:,f],(learned[:,f]>0)&~suppressed_mask[:,f],descending=True)
        training_component=np.divide(1.0,RRF_K+training_rank,out=np.zeros(shape,dtype=np.float32),where=training_rank>0)
        if method=='rrf': field_scores=field_scores+training_component
        contributions = field_scores * self.field_weights[None, :]
        type_score = np.zeros(count, dtype=np.float32)
        type_semantic = np.zeros(count, dtype=np.float32)
        type_lexical = np.zeros(count, dtype=np.float32)
        type_lexical_rank = np.zeros(count, dtype=np.int32)
        type_semantic_rank = np.zeros(count, dtype=np.int32)
        if self.include_type and query.strip() and self.unique_types:
            type_query_words = set(query_words)
            type_match_counts = np.asarray([
                len(type_query_words.intersection(words)) for words in self.unique_type_tokens
            ], dtype=np.float32)
            type_lexical_eligible = type_match_counts > 0
            type_lexical_ranks = _competition_ranks(type_match_counts, type_lexical_eligible, descending=True)
            if qvector is None:
                type_query_vector = qv
            else:
                type_query_vector = qv
            unique_type_semantic = np.maximum(self.type_vectors @ type_query_vector, 0)
            type_semantic_ranks = _competition_ranks(
                unique_type_semantic, unique_type_semantic > 0, descending=True)
            for index, label in enumerate(self.type_labels):
                unique_index = self.type_index.get(label)
                if unique_index is None:
                    continue
                type_semantic[index] = unique_type_semantic[unique_index]
                type_lexical_rank[index] = type_lexical_ranks[unique_index]
                type_semantic_rank[index] = type_semantic_ranks[unique_index]
            type_lexical = np.divide(1.0, RRF_K + type_lexical_rank,
                                     out=np.zeros(count, dtype=np.float32), where=type_lexical_rank > 0)
            type_dense = np.divide(1.0, RRF_K + type_semantic_rank,
                                   out=np.zeros(count, dtype=np.float32), where=type_semantic_rank > 0)
            type_score = self.type_weight * (type_lexical + type_dense)
        scores = contributions.sum(axis=1, dtype=np.float32) + type_score
        clock.mark("RRF, field weights and type")
        return dict(timing=clock.export(),scores=scores, contributions=contributions, semantic=semantic,
                    bm25=raw_bm25, field_scores=field_scores,
                    lexical_rank=lexical_rank, semantic_rank=semantic_rank,
                    matched=matched, matched_words=matched_words,
                    retrieval_semantic=retrieval_semantic, suppressed=suppressed_mask,
                    training_rank=training_rank,training_component=training_component,
                    type_score=type_score, type_semantic=type_semantic,
                    type_lexical=type_lexical, type_lexical_rank=type_lexical_rank,
                    type_semantic_rank=type_semantic_rank)
