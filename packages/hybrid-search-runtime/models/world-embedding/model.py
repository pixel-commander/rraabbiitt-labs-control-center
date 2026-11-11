"""Fresh shared-text dual encoder. No pretrained weights or record-ID vectors."""
import os
os.environ.setdefault('OPENBLAS_NUM_THREADS', '1')
import argparse, hashlib, json, re, time, shutil, sys
from pathlib import Path
import numpy as np
from catalog import prepare_catalog
ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent.parent

def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
def read(path): return json.loads(path.read_text(encoding='utf-8-sig'))
def tokens(text):
    text = re.sub(r'([a-z0-9])([A-Z])', r'\1 \2', text).lower()
    words = re.findall(r'[^\W_]+', text, re.UNICODE)
    return words + ['pair:'+a+'_'+b for a,b in zip(words,words[1:])]
def features(texts, vocab):
    index = {word:i for i,word in enumerate(vocab)}
    matrix = np.zeros((len(texts),len(vocab)),dtype=np.float32)
    for row,text in enumerate(texts):
        for word in tokens(text):
            if word in index: matrix[row,index[word]] += 1
    matrix = np.log1p(matrix)
    return matrix / np.maximum(np.linalg.norm(matrix,axis=1,keepdims=True),1e-8)
def normalize(x): return x / np.maximum(np.linalg.norm(x,axis=1,keepdims=True),1e-8)
def metrics(scores, targets):
    order=np.argsort(-scores,axis=1,kind='stable')
    ranks=[next(i+1 for i,j in enumerate(row) if targets[n,j]) for n,row in enumerate(order)]
    return dict(top1=float(np.mean(np.array(ranks)==1)), recall5=float(np.mean(np.array(ranks)<=5)), mrr=float(np.mean(1/np.array(ranks))), queries=len(ranks))

def prepare():
    records=prepare_catalog(PROJECT)
    if len(records)<2:raise ValueError('At least two records required')
    grouped={};validation=[]
    for record in records:
        key=record['record_key']
        for field in ('name','title','description'):
            query=str(record.get(field,'')).strip()
            if query:grouped.setdefault(query.casefold(),dict(query=query,positive_keys=[],origin='synthetic:source-fields'))['positive_keys'].append(key)
        validation.append(dict(query='find '+str(record.get('title') or record.get('name') or key),positive_keys=[key],origin='synthetic:find-title'))
    # Candidate generation is not evidence of human relevance judgments.
    candidate_count=0;excluded=[]
    evaluation=read(ROOT/'data/evaluation.json') if (ROOT/'data/evaluation.json').exists() else []
    def near(a,b):
        aa=set(tokens(a));bb=set(tokens(b))
        return a.strip().casefold()==b.strip().casefold() or len(aa&bb)/max(1,len(aa|bb))>=.65
    known_keys={r['record_key'] for r in records}
    for source in sorted((ROOT/'data/candidates').glob('*.json')):
        for item in read(source):
            if not isinstance(item.get('query'),str) or not item['query'].strip() or not isinstance(item.get('positive_keys'),list) or not item['positive_keys'] or any(k not in known_keys for k in item['positive_keys']):
                raise ValueError('Invalid candidate in '+source.name)
            if any(near(item['query'],test['query']) for test in evaluation):
                excluded.append(dict(query=item['query'],source=source.name,reason='Exact/near evaluation query'));continue
            candidate_count+=1
            row=grouped.setdefault(item['query'].strip().casefold(),dict(query=item['query'].strip(),positive_keys=[],origin=item.get('origin','synthetic:unknown'),review_status=item.get('review_status','synthetic-unreviewed')))
            row['positive_keys']=sorted(set(row['positive_keys'])|set(item['positive_keys']))
    write(ROOT/'reports/candidate-import.json',dict(accepted=candidate_count,excluded=excluded))
    training=list(grouped.values());train_keys={x['query'].casefold() for x in training}
    validation=[x for x in validation if x['query'].casefold() not in train_keys]
    # Merge identical validation queries so other relevant records are not scored as mistakes.
    merged={}
    for item in validation:
        entry=merged.setdefault(item['query'].casefold(),dict(query=item['query'],positive_keys=[],origin=item['origin']))
        entry['positive_keys'].extend(item['positive_keys'])
    write(ROOT/'data/catalog.json',records);write(ROOT/'data/train.json',training);write(ROOT/'data/validation.json',list(merged.values()))
    if not (ROOT/'data/evaluation.json').exists():write(ROOT/'data/evaluation.json',[])
    return dict(records=len(records),training=len(training),validation=len(merged),candidates=candidate_count,note='Synthetic training and title-based validation; not independent relevance evaluation.')

def train(epochs=300, activate=True):
    catalog=read(ROOT/'data/catalog.json');rows=read(ROOT/'data/train.json');validation=read(ROOT/'data/validation.json')
    if not rows or not validation:raise ValueError('Training and validation examples required')
    keys={r['record_key']:i for i,r in enumerate(catalog)}
    vocab=sorted({t for r in catalog for t in tokens(r['text'])}|{t for r in rows for t in tokens(r['query'])})
    documents=features([r['text'] for r in catalog],vocab);queries=features([r['query'] for r in rows],vocab);vq=features([r['query'] for r in validation],vocab)
    def targets(examples):
        out=np.zeros((len(examples),len(catalog)),dtype=np.float32)
        for i,row in enumerate(examples):
            for key in row['positive_keys']:out[i,keys[key]]=1
        if not np.all(out.sum(axis=1)>0):raise ValueError('Missing positives')
        return out
    positive=targets(rows);vt=targets(validation)
    rng=np.random.default_rng(42);weights=rng.normal(0,.05,(len(vocab),64)).astype(np.float32)
    first=np.zeros_like(weights);second=np.zeros_like(weights);best=weights.copy();best_loss=float('inf');best_epoch=0;curve=[];start=time.perf_counter()
    def probabilities(scores):
        exp=np.exp(scores-scores.max(axis=1,keepdims=True));return exp/exp.sum(axis=1,keepdims=True)
    def loss(p,t):return float(-np.log(np.maximum((p*t).sum(axis=1),1e-12)).mean())
    initial=metrics(normalize(vq@weights)@normalize(documents@weights).T,vt)
    for epoch in range(1,epochs+1):
        qraw=queries@weights;draw=documents@weights;q=normalize(qraw);d=normalize(draw)
        probabilities_q=probabilities(q@d.T/.1)
        gold=probabilities_q*positive;gold/=np.maximum(gold.sum(axis=1,keepdims=True),1e-12)
        delta=(probabilities_q-gold)/len(rows)/.1
        dq=delta@d;dd=delta.T@q
        dq=(dq-q*(dq*q).sum(axis=1,keepdims=True))/np.maximum(np.linalg.norm(qraw,axis=1,keepdims=True),1e-8)
        dd=(dd-d*(dd*d).sum(axis=1,keepdims=True))/np.maximum(np.linalg.norm(draw,axis=1,keepdims=True),1e-8)
        grad=queries.T@dq+documents.T@dd+1e-5*weights
        grad*=min(1.,5/max(float(np.linalg.norm(grad)),1e-8))
        first=.9*first+.1*grad;second=.999*second+.001*grad*grad
        weights-=.01*(first/(1-.9**epoch))/(np.sqrt(second/(1-.999**epoch))+1e-8)
        if not np.isfinite(weights).all():raise ValueError('Non-finite training weights')
        if epoch==1 or epoch%5==0:
            scores=normalize(vq@weights)@normalize(documents@weights).T;vl=loss(probabilities(scores/.1),vt)
            curve.append(dict(epoch=epoch,training_loss=loss(probabilities_q,positive),validation_loss=vl,**metrics(scores,vt)))
            if vl<best_loss-1e-5:best_loss=vl;best=weights.copy();best_epoch=epoch
            if epoch-best_epoch>=50:break
    stamp=str(time.time_ns());checkpoint=ROOT/'checkpoints'/('checkpoint-'+stamp+'.npz')
    np.savez_compressed(checkpoint,weights=best,vocab=np.array(vocab),vectors=normalize(documents@best),keys=np.array([r['record_key'] for r in catalog]))
    digest=hashlib.sha256((ROOT/'data/catalog.json').read_bytes()+(ROOT/'data/train.json').read_bytes()+(ROOT/'data/validation.json').read_bytes()).hexdigest()
    report=dict(architecture='Shared 64-dimensional log-count word/bigram projection; text-to-text contrastive learning',seed=42,epochs_completed=epoch,best_epoch=best_epoch,seconds=time.perf_counter()-start,records=len(catalog),examples=len(rows),vocabulary=len(vocab),parameters=int(best.size),dataset_sha256=digest,initial_validation=initial,validation=metrics(normalize(vq@best)@normalize(documents@best).T,vt),curve=curve,checkpoint=checkpoint.relative_to(ROOT).as_posix(),limitations=['Validation queries are synthetic title paraphrases, not independent relevance judgments.','No general language pretraining; unseen vocabulary has no learned representation.','Evaluation labels are provisional until reviewed by the user.'])
    write(ROOT/'reports'/('training-'+stamp+'.json'),report);write(ROOT/'reports/latest.json',report)
    # Bind the checkpoint to its exact catalog snapshot.
    write(checkpoint.with_suffix('.catalog.json'),catalog)
    snapshot=checkpoint.with_suffix('.training');snapshot.mkdir()
    for name in ('catalog.json','train.json','validation.json','evaluation.json'):
        shutil.copy2(ROOT/'data'/name,snapshot/name)
    shutil.copy2(Path(__file__),snapshot/'model.py')
    shutil.copy2(ROOT/'catalog.py',snapshot/'catalog.py')
    write(snapshot/'environment.json',dict(python=sys.version,numpy=np.__version__,epochs=epochs,seed=42))
    pointer=dict(checkpoint=report['checkpoint'],catalog=checkpoint.with_suffix('.catalog.json').relative_to(ROOT).as_posix(),dataset_sha256=digest)
    write(ROOT/'checkpoints/candidate.json',pointer)
    if activate: write(ROOT/'checkpoints/active.json',pointer)
    return {k:v for k,v in report.items() if k!='curve'}

def search(query,limit=10, active=None):
    active=active or read(ROOT/'checkpoints/active.json');catalog=read(ROOT/active['catalog'])
    with np.load(ROOT/active['checkpoint'],allow_pickle=False) as saved:
        vocab=saved['vocab'].tolist();weights=saved['weights'];vectors=saved['vectors']
        query_features=features([query],vocab);known=set(tokens(query))&set(vocab)
        if not known:return dict(results=[],known_fraction=0,reason='No query features are in the trained vocabulary.')
        scores=(normalize(query_features@weights)@vectors.T)[0];order=np.argsort(-scores,kind='stable')[:limit]
        return dict(results=[dict(record=catalog[int(i)],rank=n+1,score=float(scores[i])) for n,i in enumerate(order)],known_fraction=len(known)/max(1,len(set(tokens(query)))),score_kind='cosine similarity, not probability')


def evaluate():
    examples=read(ROOT/'data/evaluation.json')
    if not examples:return dict(queries=0,note='No independent reviewed evaluation examples supplied.')
    training={row['query'].strip().casefold() for row in read(ROOT/'data/train.json')}
    details=[]
    for row in examples:
        if row['query'].strip().casefold() in training:raise ValueError('Evaluation query also appears in training')
        result=search(row['query'],limit=100000)
        rank=next((hit['rank'] for hit in result['results'] if hit['record']['record_key'] in row['positive_keys']),None)
        details.append(dict(query=row['query'],rank=rank,expected=row['positive_keys'],top_result=result['results'][0]['record']['record_key'] if result['results'] else None))
    report=dict(checkpoint=read(ROOT/'checkpoints/active.json')['checkpoint'],queries=len(details),top1=sum(x['rank']==1 for x in details)/len(details),recall5=sum(x['rank'] is not None and x['rank']<=5 for x in details)/len(details),mrr=sum(1/x['rank'] if x['rank'] else 0 for x in details)/len(details),origin='assistant-authored provisional relevance labels; not user-reviewed',results=details)
    write(ROOT/'reports'/('evaluation-'+str(time.time_ns())+'.json'),report)
    write(ROOT/'reports/evaluation.json',report)
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('command',choices=['prepare','train','search','evaluate']);parser.add_argument('--epochs',type=int,default=300);parser.add_argument('--query',default='');args=parser.parse_args()
    if args.command=='prepare':result=prepare()
    elif args.command=='evaluate':result=evaluate()
    elif args.command=='train':
        if not 1<=args.epochs<=2000:parser.error('epochs must be 1..2000')
        result=train(args.epochs)
    else:
        if not args.query.strip():parser.error('query is required')
        result=search(args.query)
    print(json.dumps(result,ensure_ascii=False))
