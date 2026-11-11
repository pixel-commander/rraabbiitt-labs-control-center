"""Field retrieval and explicit field feedback. No action execution."""
import os
os.environ.setdefault('OPENBLAS_NUM_THREADS', '1')
import importlib.util
import hashlib
import json
import re
import sqlite3
import sys
import time
from training_data import adapt, overlaps_reserved
from contextlib import closing
from pathlib import Path
import numpy as np
import yaml

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent.parent
sys.path.insert(0, str(ROOT.parent / 'world-embedding'))
spec = importlib.util.spec_from_file_location('shared_embedding', ROOT.parent / 'world-embedding/model.py')
encoder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(encoder)
FIELDS = ('name', 'title', 'description')
INTENTS = ('locate', 'instructions', 'describe')

def positive_value(row):
    return row['correction'] if row['vote'] == 'down' or row.get('id') is not None else row['value']
PATTERNS = {
    'locate': ['where is {}', 'find {}', 'locate {}', 'which folder contains {}', 'show me the {} page', 'where can I find {}'],
    'instructions': ['how do I use {}', 'what is the command line for {}', 'what is the cli for {}', 'how can I {}', 'instructions for {}'],
    'describe': ['what is {}', 'what does {} do', 'explain {}'],
}

def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def words(text):
    return [t for t in encoder.tokens(text) if not t.startswith('pair:')]

def feedback_rows():
    db = ROOT / 'data/feedback.sqlite'
    if not db.exists():
        return []
    with closing(sqlite3.connect(db)) as connection:
        rows = connection.execute('SELECT payload FROM feedback ORDER BY id').fetchall()
    latest = {}
    for (payload,) in rows:
        row = json.loads(payload)
        latest[(row['query'].casefold(), row['record_key'], row['field'])] = row
    return list(latest.values())

def examples(catalog, feedback=None):
    """Synthetic source-field labels, with provenance, never user judgments."""
    rows = []
    for record in catalog:
        key = record['record_key']
        for field in FIELDS:
            value = record.get(field, '')
            if not value:
                continue
            rows.append(dict(query=value, record_key=key, field=field, positive=value, intent='describe', origin='source:field-value', review_status='source'))
            intent = 'locate' if field == 'name' else 'instructions' if record.get('instructions') else 'describe'
            for pattern in PATTERNS[intent][:3]:
                rows.append(dict(query=pattern.format(value), record_key=key, field=field, positive=value, intent=intent, origin='synthetic:source-field', review_status='pending'))
        if record.get('name') == 'running-the-app':
            for query in ['what is the command line to run the app', 'what is the cli to run the app', "what's the cli to run the app", 'cli to run app', 'how do i run the app?', 'where is the cli to run the app?', 'what is the cli to run the site', 'start the application', 'launch the development server', 'run this project locally', 'how do I start the website']:
                for field in FIELDS:
                    value = record.get(field, '')
                    if value:
                        rows.append(dict(query=query, record_key=key, field=field, positive=value, intent='instructions', origin='assistant-authored:running-app', review_status='pending'))
    for row in feedback_rows() if feedback is None else feedback:
        positive = positive_value(row)
        if positive:
            rows.append(dict(query=row['query'], record_key=row['record_key'], field=row['field'], positive=positive, negative=row['value'] if row['vote']=='down' else '', intent=row['intent'], origin='user:field-feedback', review_status='approved'))
    return rows

def intent_model(vocab):
    texts, labels = [], []
    for intent, patterns in PATTERNS.items():
        for pattern in patterns:
            for target in ('the app', 'HybridSeatRanking dashboard', 'the page', 'the site', 'a component'):
                texts.append(pattern.format(target)); labels.append(INTENTS.index(intent))
    for text in ('run the app', 'start the site', 'command line to launch the app', 'cli to run the site', 'what is the cli to run the app', "what's the cli to run the app", 'cli to run app', 'how do i run the app?', 'where is the cli to run the app?'):
        texts.append(text); labels.append(1)
    x = encoder.features(texts, vocab)
    weights = np.zeros((len(vocab), 3), dtype=np.float32)
    for _ in range(120):
        p = softmax(x @ weights)
        p[np.arange(len(labels)), labels] -= 1
        weights -= .8 * (x.T @ p / len(labels) + .001 * weights)
    return weights

def softmax(x):
    e = np.exp(x - x.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def field_features(query, value, cosine):
    q, v = words(query), words(value)
    qs, vs = set(q), set(v)
    compact_q, compact_v = ''.join(q), ''.join(v)
    exact = bool(compact_v) and compact_v in compact_q
    overlap = len(qs & vs) / max(1, len(vs))
    pairs = set(zip(v, v[1:]))
    ordered = len(pairs & set(zip(q, q[1:]))) / max(1, len(pairs))
    return np.array([max(0., cosine), float(exact), overlap, ordered], dtype=np.float32)

def feature_matrix(query, catalog, vectors, qvector, intent):
    matrix = np.zeros((len(catalog), 13), dtype=np.float32)
    for i, record in enumerate(catalog):
        for f, field in enumerate(FIELDS):
            matrix[i, f*4:f*4+4] = field_features(query, record.get(field, ''), float(vectors[i,f] @ qvector))
        matrix[i,12] = float(bool(record.get('instructions') or record.get('skills'))) if intent == 'instructions' else float(record.get('type') in ('dashboard','page','component')) if intent == 'locate' else 0.
    return matrix

def fit_existing_pairs(catalog, vocab, projection, vectors, intents, weights, rows=None):
    """Reuse prepared record labels without converting them into field labels."""
    source=ROOT.parent/'world-embedding/data/train.json'
    rows=rows if rows is not None else read(source) if source.exists() else []
    keys={r['record_key']:i for i,r in enumerate(catalog)}
    differences=[[] for _ in INTENTS]; accepted=[]
    for row in rows:
        positives={keys[k] for k in row['positive_keys'] if k in keys}
        if not positives: continue
        qf=encoder.features([row['query']],vocab)
        if not np.any(qf): continue
        intent=int(np.argmax(qf@intents))
        qv=encoder.normalize(qf@projection)[0]
        fs=feature_matrix(row['query'],catalog,vectors,qv,INTENTS[intent])
        negatives=[int(i) for i in np.argsort(-(fs@weights[intent])) if i not in positives][:6]
        for positive in positives:
            for negative in negatives: differences[intent].append(fs[positive]-fs[negative])
        accepted.append(row)
    anchor=weights.copy()
    for intent,data in enumerate(differences):
        if not data: continue
        d=np.array(data)
        for _ in range(60):
            g=1/(1+np.exp(np.clip(d@weights[intent],-30,30)))
            weights[intent]+=.15*(d.T@g/len(d)-.02*(weights[intent]-anchor[intent]))
            weights[intent]=np.maximum(weights[intent],0)
    return weights,accepted

def train(options=None):
    options={} if options is None else options
    if not isinstance(options,dict): raise ValueError('content must contain a JSON object')
    if options.get('engine') not in (None,'established','legacy'):
        raise ValueError('engine must be established or legacy')
    if options.get('engine')=='established' or (options.get('engine')!='legacy' and established_active()):
        import established_runtime
        return established_runtime.train(established_api(),options)
    mode=options.get('mode','live')
    include_suggestions=options.get('include_suggestions',False)
    if mode not in ('live','candidate') or type(include_suggestions) is not bool:
        raise ValueError('mode must be live/candidate; include_suggestions must be boolean')
    if include_suggestions and mode!='candidate':
        raise ValueError('Pending suggestions may only train an isolated candidate checkpoint')
    catalog = current_catalog()
    prior_pointer=read(ROOT/'checkpoints/active.json') if (ROOT/'checkpoints/active.json').exists() else None
    feedback_snapshot=feedback_rows()
    record_rows,field_rows,adaptation=adapt(ROOT.parent/'world-embedding/data',catalog,feedback_snapshot,positive_value)
    rows = examples(catalog,feedback_snapshot)
    judged={(r['query'].strip().casefold(),r['field']) for r in feedback_snapshot}
    rows=[r for r in rows if r['origin']=='user:field-feedback' or (r['query'].strip().casefold(),r['field']) not in judged]
    rows.extend(field_rows)
    reserved=read(ROOT.parent/'world-embedding/data/evaluation.json')
    excluded=[r for r in rows if r['origin']!='user:field-feedback' and overlaps_reserved(r['query'],reserved)]
    rows=[r for r in rows if r['origin']=='user:field-feedback' or not overlaps_reserved(r['query'],reserved)]
    adaptation['excluded_source_examples']=excluded
    adaptation['reserved_evaluation_sha256']=hashlib.sha256((ROOT.parent/'world-embedding/data/evaluation.json').read_bytes()).hexdigest()
    suggestions=dict(review_status='pending',field_examples=[r for r in rows if r['review_status']=='pending'],record_examples=[r for r in record_rows if r['review_status']=='pending'])
    if not include_suggestions:
        rows=[r for r in rows if r['review_status']!='pending']
        record_rows=[r for r in record_rows if r['review_status']!='pending']
    documents = [str(r.get(field, '')) for r in catalog for field in FIELDS]
    all_documents = list(dict.fromkeys(documents + [r['positive'] for r in rows]))
    doc_index = {v:i for i,v in enumerate(all_documents)}
    intent_text = [p.format('app site dashboard page command line cli') for ps in PATTERNS.values() for p in ps]
    vocab = sorted({t for text in all_documents + [r['query'] for r in rows+record_rows] + intent_text for t in encoder.tokens(text)})
    x = encoder.features(all_documents, vocab)
    q = encoder.features([r['query'] for r in rows], vocab)
    # Equivalent field values are one positive document, avoiding contradictory labels.
    positive = np.zeros((len(rows), len(all_documents)), dtype=np.float32)
    grouped={}
    for row in rows: grouped.setdefault(row['query'].strip().casefold(),set()).add(doc_index[row['positive']])
    for i,row in enumerate(rows):
        for index in grouped[row['query'].strip().casefold()]: positive[i,index]=1
    sample_weights=np.array([8. if r['origin']=='user:field-feedback' else 1. for r in rows],dtype=np.float32)
    sample_weights/=sample_weights.sum()
    rng = np.random.default_rng(42)
    weights = rng.normal(0,.05,(len(vocab),32)).astype(np.float32)
    # Reuse the local projection where vocabulary/dimensions overlap; no remote model.
    active = ROOT.parent/'world-embedding/checkpoints/active.json'
    initial_file=ROOT/prior_pointer['checkpoint']/'weights.npz' if prior_pointer else ROOT.parent/'world-embedding'/read(active)['checkpoint']
    if initial_file.exists():
        with np.load(initial_file, allow_pickle=False) as prior:
            old = {t:i for i,t in enumerate(prior['vocab'].tolist())}
            for i,t in enumerate(vocab):
                if t in old: weights[i] = prior['weights'][old[t],:32]
    first = np.zeros_like(weights); second = np.zeros_like(weights)
    for epoch in range(1,101):
        qr, dr = q@weights, x@weights
        qn, dn = encoder.normalize(qr), encoder.normalize(dr)
        p = softmax(qn@dn.T/.12)
        gold=p*positive; gold/=np.maximum(gold.sum(axis=1,keepdims=True),1e-12)
        delta = (p-gold)*sample_weights[:,None]/.12
        dq, dd = delta@dn, delta.T@qn
        dq = (dq-qn*(dq*qn).sum(1,keepdims=True))/np.maximum(np.linalg.norm(qr,axis=1,keepdims=True),1e-8)
        dd = (dd-dn*(dd*dn).sum(1,keepdims=True))/np.maximum(np.linalg.norm(dr,axis=1,keepdims=True),1e-8)
        grad = q.T@dq+x.T@dd+1e-5*weights
        grad *= min(1., 5/max(float(np.linalg.norm(grad)),1e-8))
        first = .9*first+.1*grad; second=.999*second+.001*grad*grad
        weights -= .008*(first/(1-.9**epoch))/(np.sqrt(second/(1-.999**epoch))+1e-8)
    if not np.isfinite(weights).all(): raise ValueError('Non-finite trained weights')
    vectors = encoder.normalize(encoder.features(documents,vocab)@weights).reshape(len(catalog),3,32)
    intents = intent_model(vocab)
    keys = {r['record_key']:i for i,r in enumerate(catalog)}
    rank_weights = np.array([[2,8,2,2]*3+[1]]*3, dtype=np.float32)
    diffs = [[] for _ in INTENTS]
    # Field labels supervise only the corresponding field's modifiers.
    for row in rows:
        if row['origin']=='user:field-feedback': continue
        target=keys[row['record_key']]; intent=INTENTS.index(row['intent']); field=FIELDS.index(row['field'])
        qv=encoder.normalize(encoder.features([row['query']],vocab)@weights)[0]
        fs=feature_matrix(row['query'],catalog,vectors,qv,row['intent'])
        scores=fs@rank_weights[intent]
        for neg in np.argsort(-scores)[:6]:
            if neg==target or catalog[neg].get(row['field'])==row['positive']: continue
            diff=np.zeros(13,dtype=np.float32)
            diff[field*4:field*4+4]=fs[target,field*4:field*4+4]-fs[neg,field*4:field*4+4]
            diff[12]=fs[target,12]-fs[neg,12]
            diffs[intent].append(diff)
    for intent,data in enumerate(diffs):
        if not data: continue
        d=np.array(data)
        for _ in range(100):
            g=1/(1+np.exp(np.clip(d@rank_weights[intent],-30,30)))
            rank_weights[intent] += .4*(d.T@g/len(d)-.001*rank_weights[intent])
            rank_weights[intent]=np.maximum(rank_weights[intent],0)
    stamp=str(time.time_ns()); folder=ROOT/'checkpoints'/stamp; folder.mkdir(parents=True)
    rank_weights,record_examples=fit_existing_pairs(catalog,vocab,weights,vectors,intents,rank_weights,record_rows)
    np.savez_compressed(folder/'weights.npz',weights=weights,vocab=np.array(vocab),vectors=vectors,intents=intents,rank_weights=rank_weights)
    write(folder/'catalog.json',catalog); write(folder/'examples.json',rows)
    write(folder/'record-examples.json',record_examples)
    write(folder/'adaptation.json',adaptation)
    write(folder/'feedback-snapshot.json',feedback_snapshot)
    write(folder/'suggestions.json',suggestions)
    code={}
    for source in (Path(__file__),Path(__file__).with_name('training_data.py'),PROJECT/'models/world-embedding/model.py',PROJECT/'models/world-embedding/catalog.py'):
        relative=source.relative_to(PROJECT)
        target=folder/'implementation'/relative; target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes(source.read_bytes())
        code[relative.as_posix()]=hashlib.sha256(source.read_bytes()).hexdigest()
    write(folder/'environment.json',dict(python=sys.version,numpy=np.__version__,code_sha256=code,seed=42))
    report=dict(records=len(catalog),field_examples=len(rows),record_examples=len(record_examples),feedback=len(feedback_snapshot),training_pairs=sum(map(len,diffs)),epochs=100,method='Shared local contrastive field embeddings; intent classifier; field-supervised pairwise ranking',limitations=['Small local word/bigram encoder, not a pretrained language model.','Synthetic source and assistant labels are not user-reviewed evaluation.','Warm start retains historical effects of previously trained examples.'],checkpoint=str(folder.relative_to(ROOT)),mode=mode,include_suggestions=include_suggestions,activated=False)
    report['parent']=prior_pointer['checkpoint'] if prior_pointer else None
    report['adapted_field_examples']=len(field_rows) if include_suggestions else 0
    report['pending_field_examples']=len(suggestions['field_examples'])
    report['pending_record_examples']=len(suggestions['record_examples'])
    report['record_only_examples']=adaptation['record_only']
    report['excluded_source_examples']=len(excluded)
    write(folder/'report.json',report)
    if mode=='candidate':
        return dict(summary=dict(count=len(rows)),path=str(folder.relative_to(PROJECT)),file='report.json',body=json.dumps(report))
    if prior_pointer != (read(ROOT/'checkpoints/active.json') if (ROOT/'checkpoints/active.json').exists() else None) or feedback_snapshot != feedback_rows():
        raise ValueError('New feedback arrived during training. Candidate saved; active model preserved. Rerun training to include the new feedback.')
    pointer=ROOT/'checkpoints/active.json'; temporary=pointer.with_suffix('.tmp')
    write(temporary,dict(checkpoint=str(folder.relative_to(ROOT))))
    temporary.replace(pointer)
    report['activated']=True
    write(folder/'report.json',report)
    return dict(summary=dict(count=len(rows)),path=str(folder.relative_to(PROJECT)),file='report.json',body=json.dumps(report))

def checkpoint_folder(checkpoint=None):
    folder=(ROOT/(read(ROOT/'checkpoints/active.json')['checkpoint'] if checkpoint is None else checkpoint)).resolve()
    if not folder.is_relative_to((ROOT/'checkpoints').resolve()) or folder==(ROOT/'checkpoints').resolve():
        raise ValueError('Checkpoint must be a versioned folder under this model checkpoints directory')
    return folder


def established_active(checkpoint=None):
    if checkpoint is None and not (ROOT/'checkpoints/active.json').exists(): return False
    return (checkpoint_folder(checkpoint)/'engine.json').is_file()


def established_api():
    from types import SimpleNamespace
    return SimpleNamespace(ROOT=ROOT,PROJECT=PROJECT,read=read,write=write,adapt=adapt,
        positive_value=positive_value,current_catalog=current_catalog,feedback_rows=feedback_rows,
        checkpoint_folder=checkpoint_folder)

def load(checkpoint=None):
    folder=checkpoint_folder(checkpoint)
    return read(folder/'catalog.json'), np.load(folder/'weights.npz',allow_pickle=False)

def current_catalog():
    """Read the database registered in this project's settings. No scan."""
    from portable_catalog import indexed_catalog
    return indexed_catalog(PROJECT)


def train_feedback(row):
    """Small contrastive update against same-field negatives; archive every update."""
    catalog=current_catalog()
    _catalog,saved=load()
    with saved:
        vocab=saved['vocab'].tolist(); weights=saved['weights'].copy()
        intents=saved['intents'].copy(); rank_weights=saved['rank_weights'].copy()
    positive=positive_value(row)
    texts=list(dict.fromkeys([positive]+[r.get(row['field'],'') for r in catalog if r.get(row['field'],'')]))
    new=sorted({t for text in texts+[row['query']] for t in encoder.tokens(text)}-set(vocab))
    if new:
        weights=np.concatenate([weights,np.random.default_rng(42).normal(0,.02,(len(new),32)).astype(np.float32)])
        intents=np.concatenate([intents,np.zeros((len(new),3),dtype=np.float32)])
        vocab+=new
    q=encoder.features([row['query']],vocab); d=encoder.features(texts,vocab)
    for _ in range(35):
        qr,dr=q@weights,d@weights; qn,dn=encoder.normalize(qr),encoder.normalize(dr)
        delta=softmax(qn@dn.T/.12); delta[0,0]-=1; delta/=.12
        dq,dd=delta@dn,delta.T@qn
        dq=(dq-qn*(dq*qn).sum(1,keepdims=True))/np.maximum(np.linalg.norm(qr,axis=1,keepdims=True),1e-8)
        dd=(dd-dn*(dd*dn).sum(1,keepdims=True))/np.maximum(np.linalg.norm(dr,axis=1,keepdims=True),1e-8)
        grad=q.T@dq+d.T@dd
        grad*=min(1.,1/max(float(np.linalg.norm(grad)),1e-8))
        weights-=.025*grad
    if not np.isfinite(weights).all(): raise ValueError('Non-finite feedback update')
    docs=[r.get(f,'') for r in catalog for f in FIELDS]
    vectors=encoder.normalize(encoder.features(docs,vocab)@weights).reshape(len(catalog),3,32)
    folder=ROOT/'checkpoints'/str(time.time_ns()); folder.mkdir()
    np.savez_compressed(folder/'weights.npz',weights=weights,vocab=np.array(vocab),vectors=vectors,intents=intents,rank_weights=rank_weights)
    write(folder/'catalog.json',catalog); write(folder/'feedback.json',row)
    report=dict(method='Contrastive field feedback',field=row['field'],epochs=35,checkpoint=str(folder.relative_to(ROOT)),parent=read(ROOT/'checkpoints/active.json')['checkpoint'])
    write(folder/'report.json',report)
    pointer=ROOT/'checkpoints/active.json'; temporary=pointer.with_suffix('.tmp')
    write(temporary,dict(checkpoint=str(folder.relative_to(ROOT)))); temporary.replace(pointer)
    return report

def search(query, checkpoint=None):
    if established_active(checkpoint):
        import established_runtime
        return established_runtime.search(established_api(),query,checkpoint)
    live_catalog=current_catalog() if checkpoint is None else None
    catalog,saved=load() if checkpoint is None else load(checkpoint)
    # Named checkpoint evaluation must never borrow today's changing feedback.
    if checkpoint is None:
        catalog=live_catalog
        judgments_snapshot=feedback_rows()
    else:
        folder=checkpoint_folder(checkpoint)
        if (folder/'feedback-snapshot.json').exists():
            judgments_snapshot=read(folder/'feedback-snapshot.json')
        else:
            judgments_snapshot=[]; seen=set()
            while folder and str(folder) not in seen:
                seen.add(str(folder))
                if (folder/'feedback.json').exists(): judgments_snapshot.append(read(folder/'feedback.json'))
                if (folder/'feedback-snapshot.json').exists():
                    judgments_snapshot.extend(reversed(read(folder/'feedback-snapshot.json'))); break
                parent=read(folder/'report.json').get('parent') if (folder/'report.json').exists() else None
                folder=checkpoint_folder(parent) if parent else None
            latest={}
            for row in judgments_snapshot: latest.setdefault((row['query'].casefold(),row['record_key'],row['field']),row)
            judgments_snapshot=list(latest.values())
    with saved:
        if not catalog: return dict(paths=[],summary=dict(count=0),body=json.dumps(dict(intent='describe',reason='No current records.',evidence=[])))
        vocab=saved['vocab'].tolist(); qf=encoder.features([query],vocab)
        if not np.any(qf) and not any(set(words(query)) & set(words(r.get(f,''))) for r in catalog for f in FIELDS):
            return dict(paths=[],summary=dict(count=0),body=json.dumps(dict(intent='describe',reason='No known query vocabulary or current field matches.',evidence=[])))
        probabilities=softmax(qf@saved['intents'])[0]
        intent=INTENTS[int(np.argmax(probabilities))]
        named=re.search(r'\bwhere\s+(?:is|can i find)\s+(?:the\s+)?(.+?)\s+(?:page|dashboard)\s*[?!.]*$',query,re.I)
        if named:
            target=''.join(words(named.group(1)))
            if target and not any(target in ''.join(words(r.get('name',''))) for r in catalog):
                return dict(paths=[],summary=dict(count=0),body=json.dumps(dict(intent=intent,reason='No catalog record matches the requested name.',evidence=[])))
        qv=encoder.normalize(qf@saved['weights'])[0]
        vectors=saved['vectors'] if checkpoint is not None else encoder.normalize(encoder.features([r.get(f,'') for r in catalog for f in FIELDS],vocab)@saved['weights']).reshape(len(catalog),3,32)
        fs=feature_matrix(query,catalog,vectors,qv,intent)
        weights=saved['rank_weights'][INTENTS.index(intent)]
        contributions=fs*weights
        scores=contributions.sum(axis=1)
        evidence=[]; matches=[]
        # Explicit feedback acts only on the judged query/record/field. Its training
        # examples also update the shared encoder for related wording.
        judgments={(r['record_key'],r['field']):r for r in judgments_snapshot if r['query'].casefold()==query.casefold()}
        for i,record in enumerate(catalog):
            for f,field in enumerate(FIELDS):
                judgment=judgments.get((record['record_key'],field))
                if judgment and judgment['value']==record.get(field,'') and judgment['vote']=='down':
                    scores[i]-=contributions[i,f*4:f*4+4].sum()
                    contributions[i,f*4:f*4+4]=0
        for i in np.argsort(-scores,kind='stable')[:10]:
            record=catalog[int(i)]; fields=[]; totals={}; features={}; details={}
            for f,field in enumerate(FIELDS):
                value=record.get(field,''); qwords=set(words(query)); vwords=words(value)
                counts=dict(ordered=sum(p in set(zip(words(query),words(query)[1:])) for p in zip(vwords,vwords[1:])),both=0,partial=0,single=len(qwords & set(vwords)))
                fields.append(dict(field=field,exact=bool(fs[i,f*4+1]),counts=counts))
                totals[field]=float(contributions[i,f*4:f*4+4].sum()); features[field]=float(fs[i,f*4])
                details[field]=dict(value=value,score=totals[field],semantic_score=float(fs[i,f*4]),matched_words=sorted(qwords & set(vwords)),vote=judgments.get((record['record_key'],field),{}).get('vote'))
            totals['type']=float(contributions[i,12]); features['type']=float(fs[i,12])
            matches.append(dict(record,ranking=dict(rank=len(matches)+1,score=float(scores[i]),score_kind='hybrid learned ranking',features=features,contributions=totals,fields=fields)))
            evidence.append(dict(path=record['path'],file=record.get('file',''),fields=details))
        return dict(paths=matches,summary=dict(count=len(matches)),body=json.dumps(dict(intent=intent,intent_scores=dict(zip(INTENTS,map(float,probabilities))),evidence=evidence,execution=False)))

def feedback(settings):
    if settings.get('name') == 'all':
        payload=json.loads(settings.get('content','{}'))
        query=settings.get('query'); vote=payload.get('vote')
        if not isinstance(query,str) or not query.strip() or len(query)>2000: raise ValueError('Supply query')
        rephrase=payload.get('rephrase','')
        if not isinstance(rephrase,str) or len(rephrase)>2000: raise ValueError('Invalid rephrase')
        if vote not in ('up','part','down'): raise ValueError('Invalid relevance grade')
        if payload.get('origin','user')!='user' or payload.get('review_status','approved')!='approved': raise ValueError('Model suggestions require review')
        if not established_active(): raise ValueError('Graded relevance requires the established hybrid checkpoint')
        catalog=current_catalog()
        record=next((r for r in catalog if r['record_key']==settings.get('path')),None)
        if record is None or (settings.get('id') is not None and record.get('id')!=settings['id']): raise ValueError('Record is not in the active catalog')
        rows=[dict(query=rephrase.strip() or query,group_query=query,record_key=record['record_key'],record_id=record.get('id'),
            field=field,value=record.get(field,''),vote=vote,correction='',intent='describe',
            relevance={'up':1.,'part':.5,'down':0.}[vote],origin='user:field-feedback',review_status='approved') for field in FIELDS]
        import established_runtime
        return established_runtime.feedback(established_api(),rows)
    query=settings.get('query'); key=settings.get('path'); field=settings.get('name')
    payload=json.loads(settings.get('content','{}'))
    if not isinstance(query,str) or not query.strip() or len(query)>2000: raise ValueError('Supply query')
    if field not in FIELDS or payload.get('vote') not in ('up','part','down'): raise ValueError('Invalid field or vote')
    catalog=current_catalog()
    record=next((r for r in catalog if r['record_key']==key),None)
    if record is None: raise ValueError('Record is not in the active catalog')
    correction=payload.get('correction','')
    selected_id=settings.get('id')
    rephrase=payload.get('rephrase','')
    if not isinstance(rephrase,str) or len(rephrase)>2000: raise ValueError('Invalid rephrase')
    if rephrase:
        previous=next((r for r in reversed(feedback_rows()) if r['query'].casefold()==query.casefold() and r['record_key']==key and r['field']==field),None)
        if previous:
            payload['vote']=previous['vote']; correction=previous['correction']
            selected_id=previous.get('id',selected_id)
    if selected_id is not None:
        if type(selected_id) is not int: raise ValueError('Selected record id must be numeric')
        target=next((r for r in catalog if r.get('id')==selected_id),None)
        if target is None: raise ValueError('Selected record id does not exist')
        # Up votes use the source record, never a client-supplied substitute.
        if payload['vote'] in ('up','part'): correction=target.get(field,'')
    if not isinstance(correction,str) or len(correction)>4000: raise ValueError('Invalid correction')
    if payload['vote']=='down' and not correction.strip(): raise ValueError('Supply the correct answer for this field')
    if selected_id is not None and not correction.strip(): raise ValueError('The selected record has no value for this field')
    if payload.get('origin','user')!='user' or payload.get('review_status','approved')!='approved':
        raise ValueError('LLM suggestions belong in a pending batch, not immediate user feedback')
    row=dict(query=rephrase.strip() or query,group_query=query,record_key=key,field=field,value=record.get(field,''),vote=payload['vote'],correction=correction,intent=json.loads(search(query)['body'])['intent'],origin='user:field-feedback',review_status='approved')
    if selected_id is not None: row['id']=selected_id
    if established_active():
        row['record_id']=record.get('id')
        import established_runtime
        return established_runtime.feedback(established_api(),row)
    db=ROOT/'data/feedback.sqlite'; db.parent.mkdir(parents=True,exist_ok=True)
    with closing(sqlite3.connect(db)) as connection:
        connection.execute('CREATE TABLE IF NOT EXISTS feedback(id INTEGER PRIMARY KEY, payload TEXT NOT NULL)')
        connection.execute('INSERT INTO feedback(payload) VALUES(?)',(json.dumps(row),))
        connection.commit()
    trained=train_feedback(row)
    return dict(summary=dict(count=1),body=json.dumps(dict(feedback=row,training=trained)))

def _dispatch(operation, settings):
    """Canonical shared-bag handler for both CLI and the warm local worker."""
    try:
        if not isinstance(settings,dict): raise ValueError('Settings must be an object')
        if operation not in ('search','feedback','train','fine-tune','activate'): raise ValueError('Unknown hybrid ranking operation')
        if operation in ('fine-tune','activate'):
            from fine_tuning import fine_tune, activate_candidate
            options=json.loads(settings.get('content','{}'))
            if not isinstance(options,dict): raise ValueError('content must contain a JSON object')
            response=(fine_tune if operation=='fine-tune' else activate_candidate)(established_api(),options)
        elif operation=='train': response=train(json.loads(settings.get('content','{}')))
        elif operation=='feedback': response=feedback(settings)
        else:
            query=settings.get('query')
            if not isinstance(query,str) or not query.strip() or len(query)>2000: raise ValueError('Supply query text of 1 to 2000 characters')
            options=json.loads(settings.get('content','{}'))
            if not isinstance(options,dict): raise ValueError('content must contain a JSON object')
            if 'preview_steps' in options:
                if not established_active(options.get('checkpoint')):
                    raise ValueError('Teaching preview requires an established hybrid checkpoint')
                import established_runtime
                response=established_runtime.search(established_api(),query,options.get('checkpoint'),options['preview_steps'])
            else:
                response=search(query,options.get('checkpoint'))
        return dict(status='complete',settings=settings,response=response)
    except Exception as error:
        return dict(status='error',settings=settings,error=str(error))


def dispatch(operation, settings):
    if operation not in ('train','feedback','fine-tune','activate'): return _dispatch(operation,settings)
    from training_status import session, update
    try:
        with session(ROOT, operation, settings):
            result=_dispatch(operation,settings)
            update(ROOT, status='complete' if result['status']=='complete' else 'error', stage='complete' if result['status']=='complete' else 'failed', error=result.get('error'))
            return result
    except Exception as error:
        return dict(status='error',settings=settings,error=str(error))


def run(operation):
    settings={}
    try:
        settings=json.load(sys.stdin)
        result=dispatch(operation,settings)
    except Exception as error:
        result=dict(status='error',settings=settings,error=str(error))
    print(json.dumps(result))
    if result['status']=='error': sys.exit(1)
