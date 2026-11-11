"""Search a JSON catalog with field BM25 + semantic RRF + CrossEncoder reranking."""
import argparse
import json
import math
import os
import re
from pathlib import Path

os.environ.setdefault("HF_HOME", str(Path(__file__).resolve().parent / "models" / "hf-cache"))

from sentence_transformers import SentenceTransformer

ENCODER = "sentence-transformers/multi-qa-MiniLM-L6-cos-v1"
ENCODER_REVISION = "b207367332321f8e44f96e224ef15bc607f4dbf0"
RERANKER = "cross-encoder/ms-marco-MiniLM-L6-v2"
RERANKER_REVISION = "233902d25c440f23af6f7d6e94d2946bac0bee0a"
FIELDS = ("name", "title", "description")
WEIGHTS = {"name": 2.0, "title": 1.5, "description": 1.25}


def tokens(text):
    return re.findall(r"[^\W_]+", str(text or "").casefold())


def bm25(query, documents):
    query_terms = tokens(query)
    term_docs = [tokens(document) for document in documents]
    if not term_docs:
        return []
    count = len(term_docs)
    average = sum(map(len, term_docs)) / count or 1.0
    document_frequency = {term: sum(term in set(doc) for doc in term_docs) for term in set(query_terms)}
    scores = []
    for doc in term_docs:
        score = 0.0
        for term in query_terms:
            frequency = doc.count(term)
            if not frequency:
                continue
            inverse = math.log(1 + (count - document_frequency[term] + 0.5) / (document_frequency[term] + 0.5))
            score += inverse * frequency * 2.2 / (frequency + 1.2 * (0.25 + 0.75 * len(doc) / average))
        scores.append(score)
    return scores


def rank_indexes(scores):
    return sorted(range(len(scores)), key=lambda index: (-scores[index], index))


def document(record):
    return "\n".join(f"{field.title()}: {record.get(field, '')}" for field in ("type", *FIELDS))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("query")
    parser.add_argument("--catalog", default="data/catalog.json")
    parser.add_argument("--model", default="models/candidate")
    parser.add_argument("--base", action="store_true", help="Use the pinned pretrained reranker rather than a trained candidate")
    parser.add_argument("--top", type=int, default=10)
    parser.add_argument("--shortlist", type=int, default=15)
    parser.add_argument("--device", choices=("auto", "cpu", "cuda"), default="auto")
    args = parser.parse_args()
    if args.top < 1 or args.shortlist < 1:
        parser.error("top and shortlist must be positive")
    records = json.loads(Path(args.catalog).read_text(encoding="utf-8-sig"))
    if not isinstance(records, list) or any(not isinstance(row, dict) for row in records):
        raise ValueError("Catalog must be a JSON array of record objects.")
    if not records:
        raise ValueError("Catalog is empty. Add records with type, name, title, and description fields.")
    import torch
    device = "cuda" if args.device == "auto" and torch.cuda.is_available() else ("cpu" if args.device == "auto" else args.device)
    if device == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("CUDA was requested but this Python environment cannot see a CUDA GPU.")
    encoder = SentenceTransformer(ENCODER, revision=ENCODER_REVISION, device=device)
    feature_scores = {field: [0.0] * len(records) for field in FIELDS}
    for field in FIELDS:
        values = [str(record.get(field, "")) for record in records]
        lexical = bm25(args.query, values)
        vectors = encoder.encode(values, normalize_embeddings=True, convert_to_numpy=True, show_progress_bar=False)
        query_vector = encoder.encode([args.query], normalize_embeddings=True, convert_to_numpy=True, show_progress_bar=False)[0]
        semantic = vectors @ query_vector
        lexical_rank = rank_indexes(lexical)
        semantic_rank = rank_indexes(semantic.tolist())
        lexical_position = {index: rank + 1 for rank, index in enumerate(lexical_rank)}
        semantic_position = {index: rank + 1 for rank, index in enumerate(semantic_rank)}
        for index in range(len(records)):
            feature_scores[field][index] = WEIGHTS[field] * (1 / (60 + lexical_position[index]) + 1 / (60 + semantic_position[index]))
    query_key = args.query.strip().casefold()
    feedback_path = Path("data/feedback.jsonl")
    feedback_rows = []
    if feedback_path.is_file():
        for number, line in enumerate(feedback_path.read_text(encoding="utf-8-sig").splitlines(), 1):
            if not line.strip():
                continue
            row = json.loads(line)
            if row.get("approved") is not True:
                continue
            if not isinstance(row.get("query"), str) or not row["query"].strip() or row.get("field") not in FIELDS or isinstance(row.get("grade"), bool) or row.get("grade") not in (0, 0.5, 1) or (row.get("id") is None and not row.get("record_key")):
                raise ValueError(f"{feedback_path}:{number}: approved feedback needs a valid field and grade 0, 0.5, or 1.")
            feedback_rows.append(row)
    applicable_feedback = [row for row in feedback_rows if row.get("query", "").strip().casefold() == query_key]
    for row in applicable_feedback:
        targets = [index for index, record in enumerate(records)
            if (row.get("id") is not None and str(record.get("id")) == str(row.get("id")))
            or (row.get("record_key") and str(record.get("record_key", record.get("id", ""))) == str(row.get("record_key")))]
        for index in targets:
            field = row["field"]
            if row["grade"] == 0:
                feature_scores[field][index] = 0.0
            else:
                feature_scores[field][index] += WEIGHTS[field] * row["grade"] / 61
    retrieval_scores = [sum(feature_scores[field][index] for field in FIELDS) for index in range(len(records))]
    shortlist = rank_indexes(retrieval_scores)[:min(args.shortlist, len(records))]
    if args.base:
        source = RERANKER
        model_options = {"revision": RERANKER_REVISION}
    else:
        candidate = Path(args.model)
        if not candidate.is_dir():
            raise FileNotFoundError(f"Candidate not found: {candidate}. Train one first or pass --base.")
        source = str(candidate.resolve())
        model_options = {"local_files_only": True}
    pairs = [[args.query, document(records[index])] for index in shortlist]
    from transformers import AutoModelForSequenceClassification, AutoTokenizer
    tokenizer = AutoTokenizer.from_pretrained(source, **model_options)
    reranker = AutoModelForSequenceClassification.from_pretrained(source, **model_options).to(device).eval()
    with torch.no_grad():
        encoded = tokenizer([pair[0] for pair in pairs], [pair[1] for pair in pairs], padding=True, truncation=True, max_length=512, return_tensors="pt")
        rerank_scores = reranker(**{key: value.to(device) for key, value in encoded.items()}).logits.reshape(-1).cpu().tolist()
    results = []
    for index, score in zip(shortlist, rerank_scores):
        results.append({**records[index], "retrieval_score": retrieval_scores[index], "rerank_score": float(score),
            "field_scores": {field: feature_scores[field][index] for field in FIELDS},
            "approved_feedback_applied": len(applicable_feedback)})
    results.sort(key=lambda row: row["rerank_score"], reverse=True)
    print(json.dumps(results[:args.top], indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
