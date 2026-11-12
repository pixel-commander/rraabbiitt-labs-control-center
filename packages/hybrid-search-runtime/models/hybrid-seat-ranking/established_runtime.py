"""Versioned BM25/semantic retrieval and explicit supervised example indexing.

The pretrained language encoder is frozen. Training indexes approved field/query
pairs and pending candidate pairs; it does not pretend to fine-tune that encoder.
"""
import os
import tempfile
import zipfile
import hashlib
import json
import sqlite3
import time
from collections import OrderedDict
from contextlib import closing
from pathlib import Path
import numpy as np
from established_search import FieldRetriever, FIELDS, DEFAULT_FIELD_WEIGHTS, lexical_tokens
from pretrained_encoder import encoder, model_spec, reranker
from experiment_tracking import log_checkpoint
from training_status import update

KIND = 'bm25-sentence-transformers-rrf'
_states = OrderedDict()


def signature(catalog):
    return hashlib.sha256(json.dumps([(r['record_key'], r.get('type'), [r.get(f, '') for f in FIELDS])
        for r in catalog], ensure_ascii=False).encode()).hexdigest()


def latest(rows):
    values = {}
    for row in rows:
        key = (row['query'].strip().casefold(), row['record_key'], row['field'])
        # Reinsert so newer corrections supersede older evidence deterministically.
        values.pop(key, None)
        values[key] = row
    return list(values.values())


def field_examples(catalog, feedback, inferred=()):
    ids = {r.get('id'): r for r in catalog}
    keys = {r['record_key']: r for r in catalog}
    result = []
    for row in feedback:
        field = row['field']
        target = ids.get(row.get('id')) if row.get('id') is not None else None
        target_missing = row.get('id') is not None and target is None
        positive = row['correction'] if row['vote']=='down' or row.get('id') is not None else row['value']
        if target_missing:
            positives=[]
        elif target is not None:
            positives = [target['record_key']]
        elif row['vote'] in ('up','part'):
            positives = [row['record_key']] if row['record_key'] in keys else []
        else:
            positives = [r['record_key'] for r in catalog if positive and r.get(field)==positive]
        result.append(dict(query=row['query'], field=field, positive=positive, positive_keys=positives,
            selected_id=row.get('id'),target_missing=target_missing,
            source_id=row.get('record_id',keys.get(row['record_key'],{}).get('id')),
            negative_key=row['record_key'] if row['vote']=='down' else None,
            source_value=row['value'], group_query=row.get('group_query', row['query']),
            origin='user:field-feedback', review_status='approved', vote=row['vote'], relevance=.5 if row['vote']=='part' else 1.))
    # A user labels a rephrase as the same question. Transfer only judgments
    # already approved for that query group; do not invent approval for other
    # fields, and keep explicit judgments on the new wording authoritative.
    explicit={(r['query'].strip().casefold(),r['field']) for r in result}
    aliases={}
    for row in result:
        group=row['group_query'].strip().casefold()
        aliases.setdefault(group,set()).update((row['query'],row['group_query']))
    inherited=[]
    for row in result:
        for alias in sorted(aliases[row['group_query'].strip().casefold()]):
            if (alias.strip().casefold(),row['field']) in explicit:
                continue
            inherited.append(dict(row,query=alias,origin='user:rephrase-group',source_query=row['query']))
    result.extend(inherited)
    judged = {(r['query'].strip().casefold(), r['field']) for r in result}
    for row in inferred:
        if (row['query'].strip().casefold(), row['field']) in judged:
            continue
        # Imported labels remain field labels only when the adapter supplied evidence.
        positives = [r['record_key'] for r in catalog if r.get(row['field'])==row['positive']]
        if positives:
            result.append(dict(row, positive_keys=positives, negative_key=None))
    return result


from search_telemetry import Timeline

class State:
    def __init__(self, api, folder, catalog):
        self.catalog = catalog
        self.config = api.read(folder/'engine.json')
        self.encode = encoder(api.ROOT, self.config['model'])
        with np.load(folder/'vectors.npz', allow_pickle=False) as saved:
            vectors = saved['fields'].copy() if signature(catalog)==self.config['catalog_signature'] else None
            self.example_vectors = saved['examples'].copy()
            self.positive_vectors = saved['positives'].copy()
            self.record_vectors = saved['records'].copy()
        cache = None
        self.vector_source = 'checkpoint' if vectors is not None else 'computed'
        cache_root = getattr(api, 'VECTOR_CACHE_ROOT', None)
        if vectors is None and cache_root is not None:
            key = hashlib.sha256(json.dumps([signature(catalog), [r.get('id') for r in catalog], self.config['model']], sort_keys=True).encode()).hexdigest()
            cache = Path(cache_root) / (key + '.npz')
            try:
                with np.load(cache, allow_pickle=False) as saved_cache:
                    candidate = saved_cache['fields']
                    if candidate.shape != (len(catalog), len(FIELDS), self.example_vectors.shape[-1]) or not np.isfinite(candidate).all():
                        raise ValueError('Invalid cached vector shape or values')
                    vectors = candidate.copy()
                    self.vector_source = 'disk'
            except (OSError, ValueError, KeyError, EOFError, zipfile.BadZipFile):
                pass  # This is disposable derived data, never the model checkpoint.
        vector_started = time.perf_counter()
        self.engine = FieldRetriever(catalog, self.encode, field_weights=self.config['field_weights'],
                                     vectors=vectors, include_type=self.config.get('include_type', False))
        if cache is not None and self.vector_source == 'computed':
            cache.parent.mkdir(parents=True, exist_ok=True)
            temporary = None
            try:
                with tempfile.NamedTemporaryFile(dir=cache.parent, suffix='.npz', delete=False) as output:
                    temporary = Path(output.name)
                    np.savez(output, fields=self.engine.vectors)
                os.replace(temporary, cache)
            finally:
                if temporary is not None:
                    temporary.unlink(missing_ok=True)
        self.vector_build_ms = round((time.perf_counter() - vector_started)*1000, 2)
        self.examples = api.read(folder/'examples.json')
        self.records = api.read(folder/'record-examples.json')
        self.reranker = reranker(api.ROOT,self.config['reranker']) if self.config.get('reranker') else None

    def score(self, query):
        clock=Timeline()
        qv = self.encode([query])[0]
        clock.mark("Query embedding")
        original = self.engine.score_all(query, qvector=qv)
        clock.mark("Initial field retrieval")
        adjusted = np.zeros_like(original['semantic'])
        suppressed = np.zeros(adjusted.shape, dtype=bool)
        relevance = np.ones(adjusted.shape, dtype=np.float32)
        proofs = [[[] for _ in FIELDS] for _ in self.catalog]
        index = {r['record_key']: i for i, r in enumerate(self.catalog)}
        normalized = query.strip().casefold()
        # Nearby wording uses the pretrained encoder. Exact user corrections take
        # precedence; low-similarity examples cannot alter an unrelated query.
        for j, row in enumerate(self.examples):
            exact = normalized==row['query'].strip().casefold()
            similarity = 1.0 if exact else float(self.example_vectors[j]@qv)
            if not exact and similarity < self.config['example_similarity']:
                continue
            f = FIELDS.index(row['field'])
            positives = [index[k] for k in row['positive_keys'] if k in index]
            if row.get('selected_id') is not None:
                positives=[i for i in positives if self.catalog[i].get('id')==row['selected_id']]
            if not positives and not row['positive_keys'] and not row.get('target_missing') and row.get('positive'):
                # Free-text correction without a selected ID is semantic evidence,
                # never an invented assertion that a particular record was selected.
                matches = self.engine.vectors[:, f]@self.positive_vectors[j]
                positives = np.flatnonzero(matches>=.85).tolist()
            grade=row.get('relevance',1.)
            if exact and row.get('vote')=='part':
                for i in positives: relevance[i,f]=grade
            for i in positives:
                if similarity * grade >= adjusted[i, f]:
                    adjusted[i, f] = similarity * grade
                    suppressed[i, f] = False
                    proofs[i][f].append(dict(query=row['query'], similarity=similarity,
                        origin=row['origin'], review_status=row['review_status'], positive=row['positive'],
                        source_query=row.get('source_query',row['query']),relevance=grade))
            negative = index.get(row.get('negative_key'))
            if exact and negative is not None and not row.get('target_missing') and negative not in positives and (row.get('source_id') is None or self.catalog[negative].get('id')==row['source_id']) and self.catalog[negative].get(row['field'])==row.get('source_value'):
                suppressed[negative, f] = True
                proofs[negative][f].append(dict(query=row['query'], vote='down', origin=row['origin']))
        clock.mark("Saved field examples")
        scored = self.engine.score_all(query, qvector=qv, training_evidence=adjusted, suppressed=suppressed)
        clock.mark("Field retrieval with evidence")
        # Record-only suggestions never masquerade as field-level evidence.
        record_score = np.zeros(len(self.catalog), dtype=np.float32)
        for j, row in enumerate(self.records):
            similarity = float(self.record_vectors[j]@qv)
            if normalized==row['query'].strip().casefold(): similarity=1.0
            if similarity < self.config['example_similarity']: continue
            for key in row['positive_keys']:
                if key in index: record_score[index[key]]=max(record_score[index[key]], similarity/61)
        scored['scores'] += record_score
        scored['record_score'] = record_score
        scored['proofs'] = proofs
        scored['baseline_scores']=scored['scores'].copy()
        scored['rerank_modifiers']=np.ones(len(self.catalog),dtype=np.float32)
        scored['rerank_logits']=np.zeros(len(self.catalog),dtype=np.float32)
        scored['field_modifiers']=np.ones_like(scored['contributions'])
        clock.mark('Record evidence and shortlist preparation')
        candidates=[]
        if getattr(self,'reranker',None) is not None:
            candidates=list(map(int,np.argsort(-scored['scores'],kind='stable')[:self.config.get('rerank_window',15)]))
            for i,row in enumerate(proofs):
                if any(any(p.get('query','').strip().casefold()==normalized and 'positive' in p for p in evidence) for evidence in row) and i not in candidates:
                    candidates.append(i)
            documents=['\n'.join([f"Type: {self.catalog[i].get('type','')}",
                f"Name: {self.catalog[i].get('name','')}",f"Title: {self.catalog[i].get('title','')}",
                f"Description: {self.catalog[i].get('description','')}"]) for i in candidates]
            logits=np.asarray(self.reranker.predict([(query,d) for d in documents],batch_size=32,show_progress_bar=False),dtype=np.float32).reshape(-1)
            modifiers=np.zeros(len(self.catalog),dtype=np.float32)
            modifiers[candidates]=1/(1+np.exp(-np.clip(logits,-30,30)))
            # A query-relative modifier keeps small raw logits legible in the
            # existing score UI. It preserves ordering and is not confidence.
            modifiers/=max(float(modifiers.max()),1e-12)
            scored['rerank_logits'][candidates]=logits
            scored['rerank_modifiers']=modifiers
            field_modifiers=np.repeat(modifiers[:,None],3,axis=1)
            for i,row in enumerate(proofs):
                for f,evidence in enumerate(row):
                    # A user's exact field correction outranks the general reranker
                    # for that field; other fields retain their own contributions.
                    if any(p.get('origin') in ('user:field-feedback','user:rephrase-group') and p.get('review_status')=='approved' and p.get('query','').strip().casefold()==normalized and 'positive' in p for p in evidence):
                        field_modifiers[i,f]=1
            scored['field_modifiers']=field_modifiers
            scored['contributions']*=field_modifiers
            scored['field_scores']*=field_modifiers
            scored['type_score']*=modifiers
            scored['record_score']*=modifiers
            scored['scores']=scored['contributions'].sum(axis=1)+scored['type_score']+scored['record_score']
        clock.mark('Cross-encoder and modifiers')
        scored['relevance_modifiers']=relevance
        scored['contributions']*=relevance
        scored['field_scores']*=relevance
        # Whole-record wrong feedback also removes type/record-only boosts.
        rejected=np.all(suppressed,axis=1)
        scored['type_score'][rejected]=0
        scored['record_score'][rejected]=0
        scored['scores']=scored['contributions'].sum(axis=1)+scored['type_score']+scored['record_score']
        clock.mark("Final relevance adjustments")
        scored["timing"]=clock.export(catalog_count=len(self.catalog),reranked_count=len(candidates),rerank_window=self.config.get("rerank_window",15),retrieval_passes=[original.get("timing"),scored.get("timing")])
        return scored


def state(api, folder, catalog):
    key = (str(api.ROOT.resolve()), str(folder), hashlib.sha256(json.dumps(catalog, sort_keys=True).encode()).hexdigest(), (folder/'engine.json').stat().st_mtime_ns)
    reused = key in _states
    if not reused:
        _states[key] = State(api, folder, catalog)
        if len(_states)>4:
            _, old = _states.popitem(last=False)
            old.engine.close()
    _states.move_to_end(key)
    _states[key].cache_reused = reused
    return _states[key]


def preview_state(current, steps):
    """Index explicit preview lessons in a private state; never write live feedback."""
    import copy
    if not isinstance(steps, list) or len(steps) > 50:
        raise ValueError('Supply at most 50 preview steps')
    catalog = current.catalog
    rows = []
    for step in steps:
        if not isinstance(step, dict): raise ValueError('Invalid preview step')
        query = step.get('query')
        if not isinstance(query, str) or not query.strip() or len(query) > 2000:
            raise ValueError('Supply preview query text of 1 to 2000 characters')
        record = next((r for r in catalog if r['record_key'] == step.get('path')), None)
        if record is None: raise ValueError('Preview record is no longer in the catalog')
        field = step.get('name')
        if field not in (*FIELDS, 'all'): raise ValueError('Invalid preview field')
        payload = json.loads(step.get('content', '{}'))
        if not isinstance(payload, dict) or payload.get('vote') not in ('up', 'part', 'down'):
            raise ValueError('Invalid preview grade')
        if payload.get('origin', 'user') != 'user' or payload.get('review_status', 'approved') != 'approved':
            raise ValueError('Preview requires reviewed feedback')
        rephrase = payload.get('rephrase', '')
        correction = payload.get('correction', '')
        if not isinstance(rephrase, str) or len(rephrase) > 2000 or not isinstance(correction, str) or len(correction) > 4000:
            raise ValueError('Invalid preview correction or rephrase')
        selected = next((r for r in catalog if r.get('id') == step.get('id')), None) if step.get('id') is not None else None
        if step.get('id') is not None and (type(step['id']) is not int or selected is None):
            raise ValueError('Preview selected record does not exist')
        if field == 'all' and selected is not None and selected['record_key'] != record['record_key']:
            raise ValueError('Whole-answer preview ID must match the source record')
        for name in FIELDS if field == 'all' else (field,):
            value = correction
            if selected is not None and payload['vote'] in ('up', 'part'):
                value = selected.get(name, '')
            if field != 'all' and payload['vote'] == 'down' and not value.strip():
                raise ValueError('Supply the correct answer for this field')
            row = dict(query=rephrase.strip() or query, group_query=query, record_key=record['record_key'],
                       record_id=record.get('id'), field=name, value=record.get(name, ''),
                       vote=payload['vote'], correction=value, origin='user:field-feedback', review_status='approved')
            if field != 'all' and selected is not None: row['id'] = selected['id']
            rows.append(row)
    added = field_examples(catalog, latest(rows))
    replaced = {(r['query'].strip().casefold(), r['field'], r.get('source_id')) for r in added}
    isolated = copy.copy(current)
    isolated.examples = [r for r in current.examples if (r['query'].strip().casefold(), r['field'], r.get('source_id')) not in replaced] + added
    isolated.example_vectors = current.encode([r['query'] for r in isolated.examples])
    isolated.positive_vectors = current.encode([r['positive'] for r in isolated.examples])
    return isolated


def search(api, query, checkpoint=None, preview_steps=None):
    request_clock=Timeline()
    folder = api.checkpoint_folder(checkpoint)
    catalog = api.current_catalog() if checkpoint is None else api.read(folder/'catalog.json')
    if not catalog or not query.strip():
        return dict(paths=[], summary=dict(count=0), body=json.dumps(dict(intent='describe', evidence=[], execution=False)))
    import re
    named = re.search(r'\bwhere\s+(?:is|can i find)\s+(?:the\s+)?(.+?)\s+(?:page|dashboard)\s*[?!.]*$', query, re.I)
    if named:
        target=''.join(lexical_tokens(named.group(1)))
        if target and not any(target in ''.join(lexical_tokens(r.get('name',''))) for r in catalog):
            return dict(paths=[], summary=dict(count=0), body=json.dumps(dict(intent='locate', evidence=[], execution=False, reason='No matching named record.')))
    current = state(api, folder, catalog)
    vector_cache = dict(source="memory" if current.cache_reused else current.vector_source, build_ms=0 if current.cache_reused else current.vector_build_ms)
    if preview_steps is not None:
        current = preview_state(current, preview_steps)
    request_clock.mark("Catalog and model state")
    scored = current.score(query)
    # Diagnostic-only seat inference. Preserve all established ranking scores.
    from seats.dispatch import dispatch as predict_seats
    seat_result = predict_seats('predict-seats', {'query': query})
    seat_evidence = (json.loads(seat_result['response']['body']) if seat_result['status']=='complete'
                     else {'status':'error','error':seat_result['error']})
    request_clock.mark("Scoring")
    matches, evidence = [], []
    for i in np.argsort(-scored['scores'], kind='stable')[:10]:
        i=int(i)
        if scored['scores'][i]<=0: continue
        record=catalog[i]
        totals={f:float(scored['contributions'][i,j]) for j,f in enumerate(FIELDS)}
        totals['type']=float(scored.get('type_score', np.zeros(len(catalog)))[i])
        totals['training']=float(scored['record_score'][i])
        details, fields, features = {}, [], {}
        features['rerank_modifier']=float(scored['rerank_modifiers'][i])
        features['rerank_logit']=float(scored['rerank_logits'][i])
        for j, field in enumerate(FIELDS):
            value=record.get(field,'')
            exact=bool(value) and ''.join(lexical_tokens(value))==''.join(lexical_tokens(query))
            words=scored['matched_words'][i][j]
            fields.append(dict(field=field, exact=exact, counts=dict(ordered=0,both=0,partial=0,single=len(words))))
            features[field]=float(scored['semantic'][i,j])
            features[field+'_weight']=float(current.engine.field_weights[j])
            features[field+'_match']=float(scored['field_scores'][i,j])
            details[field]=dict(value=value,score=totals[field],match_score=float(scored['field_scores'][i,j]),
                weight=float(current.engine.field_weights[j]),semantic_score=features[field],
                bm25=float(scored['bm25'][i,j]),lexical_rank=int(scored['lexical_rank'][i,j]),
                semantic_rank=int(scored['semantic_rank'][i,j]),matched_words=words,
                training_rank=int(scored['training_rank'][i,j]),
                rerank_modifier=float(scored['field_modifiers'][i,j]),relevance_modifier=float(scored['relevance_modifiers'][i,j]),
                training_evidence=scored['proofs'][i][j],suppressed=bool(scored['suppressed'][i,j]))
        matches.append(dict(record,ranking=dict(rank=len(matches)+1,score=sum(totals.values()),
            baseline_score=float(scored['baseline_scores'][i]),score_kind=KIND,features=features,contributions=totals,fields=fields)))
        evidence.append(dict(path=record['path'],file=record.get('file',''),fields=details))
    return dict(paths=matches,summary=dict(count=len(matches)),body=json.dumps(dict(intent='describe',
        method=KIND,checkpoint=str(folder.relative_to(api.ROOT)),field_weights=current.config['field_weights'],
        evidence=evidence,vector_cache=vector_cache,execution=False,seat_prediction=seat_evidence,seat_ranking_enabled=False,**({'timing':dict(scored['timing'],request=request_clock.export(scope='Python search; excludes HTTP transport and browser rendering'))} if checkpoint is None else {}))))


def prepare(api, catalog, feedback, options, parent, inherited=None):
    config = dict(kind=KIND, model=model_spec(api.ROOT), field_weights=dict(DEFAULT_FIELD_WEIGHTS),
                  include_type=options.get('include_type',True),example_similarity=.85)
    config['reranker']=api.read(api.ROOT/'data/pretrained/reranker.json')
    config['rerank_window']=15
    if inherited:
        config.update({k:inherited[k] for k in ('model','field_weights','include_type','example_similarity','reranker','rerank_window') if k in inherited})
    update(api.ROOT,stage='loading-model', training_on={'records':len(catalog),'feedback':len(feedback),'fields':list(FIELDS)}, mode=options.get('mode','live'))
    encode=encoder(api.ROOT,config['model'])
    record_rows, inferred, adaptation = api.adapt(api.ROOT.parent/'world-embedding/data',catalog,feedback,api.positive_value)
    suggestions=dict(review_status='pending',field_examples=[r for r in inferred if r['review_status']=='pending'],
                     record_examples=[r for r in record_rows if r['review_status']=='pending'])
    extra=inferred if options.get('include_suggestions') else []
    examples=field_examples(catalog,feedback,extra)
    # Approved user fields are already indexed above; pending record pairs stay separate.
    records=suggestions['record_examples'] if options.get('include_suggestions') else []
    if inherited and not options.get('include_suggestions'):
        # An incremental human correction preserves a candidate's exact training set.
        # Live checkpoints never have pending rows; this branch preserves that boundary.
        records=[]
    dims=config['model']['dimensions']
    def vectors(texts): return encode(texts) if texts else np.zeros((0,dims),dtype=np.float32)
    folder=api.ROOT/'checkpoints'/str(time.time_ns()); folder.mkdir(parents=True)
    config['catalog_signature']=signature(catalog)
    update(api.ROOT,stage='encoding',checkpoint=str(folder.relative_to(api.ROOT)), examples=len(examples))
    np.savez_compressed(folder/'vectors.npz',fields=vectors([r.get(f,'') for r in catalog for f in FIELDS]).reshape(len(catalog),3,dims),
        examples=vectors([r['query'] for r in examples]),positives=vectors([r['positive'] for r in examples]),
        records=vectors([r['query'] for r in records]))
    update(api.ROOT,stage='saving')
    for name, value in [('engine',config),('catalog',catalog),('examples',examples),('record-examples',records),
                        ('feedback-snapshot',feedback),('suggestions',suggestions),('adaptation',adaptation)]:
        api.write(folder/(name+'.json'),value)
    code={}
    for name in ['retrieval.py','established_runtime.py','established_search.py','pretrained_encoder.py','training_data.py','experiment_tracking.py','requirements.txt','training_status.py','fine_tuning.py','training_chunks.py','loss_landscape.py','search_telemetry.py','training_diagnostics.py']:
        source=Path(__file__).parent/name
        target=folder/'implementation'/name; target.parent.mkdir(exist_ok=True)
        target.write_bytes(source.read_bytes());code[name]=hashlib.sha256(source.read_bytes()).hexdigest()
    api.write(folder/'environment.json',dict(code_sha256=code,model=config['model'],numpy=np.__version__))
    report=dict(method=KIND,checkpoint=str(folder.relative_to(api.ROOT)),parent=parent,
        mode=options.get('mode','live'),activated=False,include_suggestions=options.get('include_suggestions',False),
        records=len(catalog),field_examples=len(examples),record_examples=len(records),feedback=len(feedback),
        field_weights=config['field_weights'],include_type=config['include_type'],encoder_frozen=True,
        training='Indexes supervised query/field examples using the pinned pretrained encoder; no encoder fine-tuning.',
        limitations=['Semantic example transfer uses a fixed similarity gate; it is not a calibrated probability.',
                     'Evaluation labels require human review; out-of-domain abstention is not calibrated.'])
    if options.get('tuning_run'):
        report.update(reranker_fine_tuned=True,tuning_run=options['tuning_run'],evaluation=options['evaluation'])
    api.write(folder/'report.json',report)
    update(api.ROOT,stage='tracking')
    tracking=log_checkpoint(api.ROOT,folder,report,parent)
    report['tracking']=tracking
    api.write(folder/'report.json',report)
    return folder,report


def activate(api, folder, report, prior):
    if api.read(api.ROOT/'checkpoints/active.json')!=prior:
        raise ValueError('Active checkpoint changed during training; prepared checkpoint retained without activation.')
    update(api.ROOT,stage='activating')
    pointer=api.ROOT/'checkpoints/active.json'
    temporary=pointer.with_name('active-'+folder.name+'.tmp')
    api.write(temporary,dict(checkpoint=str(folder.relative_to(api.ROOT))))
    temporary.replace(pointer)
    report['activated']=True
    api.write(folder/'report.json',report)


def train(api, options):
    mode=options.get('mode','live')
    pending=options.get('include_suggestions',False)
    if mode not in ('candidate','live') or type(pending) is not bool:
        raise ValueError('mode must be live/candidate; include_suggestions must be boolean')
    if pending and mode!='candidate':
        raise ValueError('Pending suggestions may only train an isolated candidate checkpoint')
    if type(options.get('include_type',True)) is not bool:
        raise ValueError('include_type must be boolean')
    prior=api.read(api.ROOT/'checkpoints/active.json')
    feedback=api.feedback_rows()
    folder,report=prepare(api,api.current_catalog(),feedback,options,prior['checkpoint'])
    if mode=='live':
        if feedback!=api.feedback_rows():
            raise ValueError('Feedback changed during training; candidate saved without activation.')
        activate(api,folder,report,prior)
    return dict(summary=dict(count=report['field_examples']),path=str(folder.relative_to(api.PROJECT)),
                file='report.json',body=json.dumps(report))


def feedback(api,row):
    rows=row if isinstance(row,list) else [row]
    db=api.ROOT/'data/feedback.sqlite';db.parent.mkdir(parents=True,exist_ok=True)
    with closing(sqlite3.connect(db, timeout=60)) as connection:
        connection.execute('CREATE TABLE IF NOT EXISTS feedback(id INTEGER PRIMARY KEY,payload TEXT NOT NULL)')
        connection.commit(); connection.execute('BEGIN IMMEDIATE')
        prior=api.read(api.ROOT/'checkpoints/active.json')
        inherited=api.read(api.checkpoint_folder()/'engine.json')
        snapshot=latest([json.loads(r[0]) for r in connection.execute('SELECT payload FROM feedback ORDER BY id')]+rows)
        folder,report=prepare(api,api.current_catalog(),snapshot,dict(mode='live',include_suggestions=False),prior['checkpoint'],inherited)
        connection.executemany('INSERT INTO feedback(payload) VALUES(?)',[(json.dumps(item),) for item in rows])
        try:
            activate(api,folder,report,prior)
            connection.commit()
        except Exception:
            connection.rollback()
            current=api.read(api.ROOT/'checkpoints/active.json')
            if current.get('checkpoint')==str(folder.relative_to(api.ROOT)):
                pointer=api.ROOT/'checkpoints/active.json';temporary=pointer.with_name('rollback-'+folder.name+'.tmp')
                api.write(temporary,prior);temporary.replace(pointer)
            report['activated']=False;api.write(folder/'report.json',report)
            raise
    from training_chunks import save
    from fine_tuning import raw_feedback
    save(api.ROOT, raw_feedback(api.ROOT))
    return dict(summary=dict(count=len(rows)),body=json.dumps(dict(feedback=row,training=report)))
