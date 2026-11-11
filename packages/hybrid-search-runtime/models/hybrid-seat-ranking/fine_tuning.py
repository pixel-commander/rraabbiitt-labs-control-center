"""Local, candidate-only cross-encoder fine-tuning with retained graded data."""
import hashlib
import json
import math
import random
import sqlite3
import time
from collections import defaultdict
from contextlib import closing
from pathlib import Path
from training_status import update, size
from training_chunks import save as save_chunks, digest

def document(record):
    return '\n'.join(f'{label}: {record.get(key, "")}' for label,key in
        [('Type','type'),('Name','name'),('Title','title'),('Description','description')])

def dataset(catalog, feedback, seen_queries=()):
    """Complete labels train whole answers; partial labels train only their field.

    Unreviewed proposals and partial field corrections are retained, not guessed.
    Connected rephrase groups are split together, including transitive aliases.
    """
    from established_runtime import field_examples, latest
    parents={}
    def find(q):
        q=q.strip().casefold();parents.setdefault(q,q)
        if parents[q]!=q: parents[q]=find(parents[q])
        return parents[q]
    for row in feedback:
        a,b=find(row['query']),find(row.get('group_query',row['query']))
        parents[max(a,b)]=min(a,b)
    approved=[r for r in latest(feedback) if r.get('review_status')=='approved' and r.get('origin')]
    evidence=field_examples(catalog,approved)
    labels=defaultdict(dict); records={r['record_key']:r for r in catalog}
    for row in evidence:
        for key in row['positive_keys']:
            if key in records: labels[(row['query'],key)][row['field']]=row.get('relevance',1.)
        key=row.get('negative_key')
        if key in records and key not in row['positive_keys'] and records[key].get(row['field'])==row['source_value']:
            labels[(row['query'],key)][row['field']]=0.
    pairs=[]; excluded=[]
    for (query,key),fields in labels.items():
        common=dict(query=query,record_key=key,record_id=records[key].get('id'),group=find(query),
            origins=sorted({r['origin'] for r in approved if find(r['query'])==find(query)}),review_status='approved')
        if set(fields)==set(('name','title','description')) and len(set(fields.values()))==1:
            pairs.append(dict(common,scope='record',document=document(records[key]),grade=next(iter(fields.values()))))
        else:
            for field,grade in fields.items():
                pairs.append(dict(common,scope=field,document=f'{field.title()}: {records[key].get(field, "")}',grade=grade))
    # Stable per-group split. It cannot leak a rephrase of a training question.
    groups=sorted({r['group'] for r in pairs},key=lambda q:digest(q))
    seen={find(q) for q in seen_queries}
    held={g for g in groups if int(digest(g)[:8],16)%4==0 and g not in seen}
    return dict(train=[r for r in pairs if r['group'] not in held],test=[r for r in pairs if r['group'] in held],
        excluded=excluded,split='Connected rephrase families; stable hash 25% holdout. Ancestor training queries cannot enter holdout.',groups=len(groups))

def metrics(rows,logits):
    groups=defaultdict(list);loss=0.
    for row,score in zip(rows,logits):
        score=float(score)
        if not math.isfinite(score): raise ValueError('Non-finite evaluation score')
        loss+=max(score,0)-score*row['grade']+math.log1p(math.exp(-abs(score)))
        groups[(row['query'],row.get('scope','record'))].append((score,row['grade']))
    ndcg=[];ranking_groups=set()
    for (query,scope),values in groups.items():
        if scope!='record': continue # Field labels never count as whole-answer ranking tests.
        if len({v[1] for v in values})<2: continue
        ranking_groups.update(r['group'] for r in rows if r['query']==query)
        def dcg(grades): return sum((2**g-1)/math.log2(i+2) for i,g in enumerate(grades[:10]))
        ideal=dcg(sorted([v[1] for v in values],reverse=True))
        ndcg.append(dcg([v[1] for v in sorted(values,key=lambda v:-v[0])])/ideal if ideal else 0.)
    return dict(bce=loss/len(rows) if rows else None,ndcg=sum(ndcg)/len(ndcg) if ndcg else None,
        ranking_queries=len(ndcg),ranking_groups=len(ranking_groups),examples=len(rows),groups=len({r['group'] for r in rows}))

def gate(before,after,train_rows):
    reasons=[]
    if after.get('ranking_groups',0)<5: reasons.append('Need at least 5 held-out query families with contrasting graded answers.')
    if not any(r['grade']==0 for r in train_rows) or not any(r['grade']==1 for r in train_rows): reasons.append('Training needs both approved correct and wrong answers.')
    if after['bce'] is None or after['bce']>before['bce']: reasons.append('Held-out label loss did not improve or stay level.')
    if after['ndcg'] is None or before['ndcg'] is None or after['ndcg']<=before['ndcg']: reasons.append('Held-out NDCG@10 did not strictly improve.')
    return dict(passed=not reasons,reasons=reasons,scope='Cross-encoder on human-judged held-out answers; not a full-catalog recall test.')

def raw_feedback(root):
    db=root/'data/feedback.sqlite'
    if not db.exists(): return []
    with closing(sqlite3.connect(db)) as c: return [json.loads(r[0]) for r in c.execute('SELECT payload FROM feedback ORDER BY id')]

def tuning_dataset(api):
    config=api.read(api.checkpoint_folder()/"engine.json")
    seen_queries=[];ancestor=config.get('reranker',{}).get('path','');visited=set()
    while ancestor.replace('\\','/').startswith('tuning/') and ancestor not in visited:
        visited.add(ancestor);older=api.ROOT/ancestor;old_data=api.read(older.parent/'dataset.json')
        seen_queries.extend(r['query'] for r in old_data['train'])
        old_report=api.read(older.parent/'report.json')
        ancestor=api.read(api.checkpoint_folder(old_report['parent'])/'engine.json').get('reranker',{}).get('path','')
    return dataset(api.current_catalog(),raw_feedback(api.ROOT),seen_queries)

def fine_tune(api,options):
    update(api.ROOT,stage='loading-model',mode='candidate')
    import torch
    import numpy as np
    from sentence_transformers import CrossEncoder
    import established_runtime as runtime
    from pretrained_encoder import reranker
    from experiment_tracking import log_run
    epochs=options.get('epochs',1);batch=options.get('batch_size',4);lr=options.get('learning_rate',2e-5)
    if type(epochs)!=int or not 1<=epochs<=10 or type(batch)!=int or not 1<=batch<=16: raise ValueError('epochs must be 1–10; batch_size 1–16')
    if type(lr) not in (int,float) or not math.isfinite(lr) or not 0<lr<=.001: raise ValueError('learning_rate must be > 0 and <= .001')
    if options.get('start_from','current') not in ('current','pretrained'): raise ValueError('start_from must be current or pretrained')
    if type(options.get('diagnostics',True)) is not bool: raise ValueError('diagnostics must be true or false')
    if type(options.get('landscape',False)) is not bool: raise ValueError('landscape must be true or false')
    prior=api.read(api.ROOT/'checkpoints/active.json');parent=api.checkpoint_folder()
    config=api.read(parent/'engine.json');catalog=api.current_catalog();raw=raw_feedback(api.ROOT)
    refs=save_chunks(api.ROOT,raw);data=tuning_dataset(api)
    from training_chunks import chunks
    contents={c['id']:c for c in chunks(raw)}
    for ref in refs:
        queries={r['query'].strip().casefold() for r in contents[ref['id']]['examples']}
        families={r['group'] for r in data['train']+data['test'] if r['query'].strip().casefold() in queries}
        ref['training_examples']=sum(r['group'] in families for r in data['train'])
        ref['test_examples']=sum(r['group'] in families for r in data['test'])
    run=api.ROOT/'tuning'/str(time.time_ns());run.mkdir(parents=True)
    api.write(run/'dataset.json',dict(data,chunks=refs,feedback=raw,catalog=catalog))
    dataset_hash=hashlib.sha256((run/'dataset.json').read_bytes()).hexdigest()
    report=dict(kind='cross-encoder-fine-tune',run=str(run.relative_to(api.ROOT)),parent=prior['checkpoint'],
        dataset_sha256=dataset_hash,epochs=epochs,batch_size=batch,learning_rate=lr,start_from=options.get('start_from','current'),
        chunks=refs,train_examples=len(data['train']),test_examples=len(data['test']),activated=False)
    api.write(run/'report.json',report)
    update(api.ROOT,stage='dataset',run=report['run'],training_on=dict(train=len(data['train']),test=len(data['test']),chunks=len(refs)),mode='candidate')
    if not data['train'] or not data['test']: raise ValueError('Dataset saved. Need reviewed examples in both the training and held-out query families before tuning.')
    baseline_spec=config['reranker'];start_spec=api.read(api.ROOT/'data/pretrained/reranker.json') if report['start_from']=='pretrained' else baseline_spec
    update(api.ROOT,stage='loading-model')
    baseline=reranker(api.ROOT,baseline_spec)
    pairs=[[r['query'],r['document']] for r in data['test']]
    # Explicit identity activation ensures these are logits, not double-sigmoids.
    before=metrics(data['test'],baseline.predict(pairs,activation_fn=torch.nn.Identity(),show_progress_bar=False))
    reranker(api.ROOT,start_spec) # Verify pinned hashes before training a separate instance.
    model=CrossEncoder(str(api.ROOT/start_spec['path']),device='cpu',local_files_only=True,trust_remote_code=False)
    torch.set_num_threads(2);torch.manual_seed(42);random.seed(42)
    optimizer=torch.optim.AdamW(model.model.parameters(),lr=lr)
    total=epochs*math.ceil(len(data['train'])/batch);step=0;curve=[]
    weight_before=next(model.model.parameters()).detach().clone()
    landscape=None
    if options.get('landscape',False):
        from loss_landscape import LandscapeRecorder
        probe=sorted(data['train'],key=lambda row:digest(row))[:8]
        probe_tokens=model.tokenizer([r['query'] for r in probe],[r['document'] for r in probe],padding=True,truncation=True,max_length=512,return_tensors='pt')
        probe_targets=torch.tensor([r['grade'] for r in probe],dtype=torch.float32)
        def measure():
            return torch.nn.functional.binary_cross_entropy_with_logits(model.model(**probe_tokens).logits.reshape(-1),probe_targets)
        landscape=LandscapeRecorder(model.model,measure,probe)
    diagnostics=options.get('diagnostics',True);loss_history=[];gradients=[]
    from training_diagnostics import measure_loss,gradient_snapshot
    def record_losses(step):
        loss_history.append(dict(step=step,train=measure_loss(model,data['train']),validation=measure_loss(model,data['test'])))
        api.write(run/'loss-history.json',dict(points=loss_history,train_count=len(data['train']),validation_count=len(data['test']),dataset_sha256=dataset_hash))
    if diagnostics: record_losses(0)
    for epoch in range(epochs):
        rows=list(data['train']);random.Random(42+epoch).shuffle(rows);model.model.train()
        for offset in range(0,len(rows),batch):
            current=rows[offset:offset+batch]
            tokens=model.tokenizer([r['query'] for r in current],[r['document'] for r in current],padding=True,truncation=True,max_length=512,return_tensors='pt')
            targets=torch.tensor([r['grade'] for r in current],dtype=torch.float32)
            optimizer.zero_grad();logits=model.model(**tokens).logits.reshape(-1)
            loss=torch.nn.functional.binary_cross_entropy_with_logits(logits,targets)
            if not torch.isfinite(loss): raise ValueError('Non-finite training loss; candidate not activated')
            loss.backward()
            if diagnostics: gradients.append(gradient_snapshot(model.model,step+1))
            gradient_norm=torch.nn.utils.clip_grad_norm_(model.model.parameters(),1.)
            if diagnostics:
                gradients[-1].update(global_norm=float(gradient_norm),clipping_threshold=1.,clipped=float(gradient_norm)>1.)
                api.write(run/'gradient-history.json',dict(steps=gradients))
            optimizer.step()
            step+=1;curve.append(dict(step=step,epoch=epoch+1,loss=float(loss.detach())))
            if landscape: landscape.record(step,epoch+1)
            if diagnostics: record_losses(step)
            update(api.ROOT,stage='tuning',step=step,total_steps=total,epoch=epoch+1,epochs=epochs,loss=curve[-1]['loss'],curve=curve)
    changed=not torch.equal(weight_before,next(model.model.parameters()).detach())
    if not changed: raise ValueError('Weights did not change')
    if landscape:
        update(api.ROOT,stage='landscape',landscape_done=0,landscape_total=81)
        sampled=landscape.sample(lambda done,total:update(api.ROOT,stage='landscape',landscape_done=done,landscape_total=total))
        sampled.update(start_model=start_spec,dataset_sha256=dataset_hash)
        api.write(run/'landscape.json',sampled)
        report['landscape_file']='landscape.json'
        report['landscape_bytes']=size(run/'landscape.json')
        del landscape
    update(api.ROOT,stage='evaluating')
    model.model.eval();after=metrics(data['test'],model.predict(pairs,activation_fn=torch.nn.Identity(),show_progress_bar=False))
    decision=gate(before,after,data['train'])
    update(api.ROOT,stage='saving')
    target=run/'model';model.save(str(target))
    spec=dict(model_id=start_spec['model_id'],path=str(target.relative_to(api.ROOT)),revision=run.name,
        file_sha256={str(p.relative_to(target)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in target.rglob('*') if p.is_file()})
    api.write(run/'model.json',spec)
    report.update(before=before,after=after,gate=decision,weights_changed=changed,curve=curve,model_bytes=size(target),model=spec)
    api.write(run/'report.json',report)
    # Build a usable search checkpoint with exactly the current evidence and new reranker.
    inherited=dict(config,reranker=spec)
    folder,checkpoint_report=runtime.prepare(api,catalog,runtime.latest(raw),dict(mode='candidate',tuning_run=report['run'],evaluation=decision),prior['checkpoint'],inherited)
    report['checkpoint']=str(folder.relative_to(api.ROOT))
    checkpoint_report.update(reranker_fine_tuned=True,tuning_run=report['run'],evaluation=decision)
    api.write(folder/'report.json',checkpoint_report)
    api.write(run/'report.json',report)
    update(api.ROOT,stage='tracking',run=report['run'],evaluation=decision)
    report['tracking']=log_run(api.ROOT,'fine-tune:'+run.name,
        dict(epochs=epochs,batch_size=batch,learning_rate=lr,dataset_sha256=dataset_hash),
        dict(before_bce=before['bce'],after_bce=after['bce']),
        {'dataset':run/'dataset.json','report':run/'report.json'}, {'training.kind':'cross-encoder-weight-update'})
    api.write(run/'report.json',report)
    return dict(body=json.dumps(report),path=str(run.relative_to(api.PROJECT)),file='report.json',summary=dict(count=len(data['train'])))

def activate_candidate(api,options):
    from established_runtime import activate
    folder=(api.ROOT/str(options.get('run',''))).resolve()
    if folder.parent!=(api.ROOT/'tuning').resolve(): raise ValueError('Select a saved tuning run')
    report=api.read(folder/'report.json')
    if not report.get('gate',{}).get('passed'): raise ValueError('Candidate has not passed its evaluation gate')
    if hashlib.sha256((folder/'dataset.json').read_bytes()).hexdigest()!=report['dataset_sha256']: raise ValueError('Dataset hash mismatch')
    prior=api.read(api.ROOT/'checkpoints/active.json')
    if prior['checkpoint']!=report['parent']: raise ValueError('Active checkpoint changed; retune against the current checkpoint')
    saved=api.read(folder/'dataset.json')
    if raw_feedback(api.ROOT)!=saved['feedback']: raise ValueError('Feedback changed; retune to include the new grades')
    from established_runtime import signature
    if signature(api.current_catalog())!=signature(saved['catalog']): raise ValueError('Catalog changed; retune before activation')
    from pretrained_encoder import reranker
    reranker(api.ROOT,report['model'])
    checkpoint=api.checkpoint_folder(report['checkpoint']);details=api.read(checkpoint/'report.json')
    activate(api,checkpoint,details,prior);report['activated']=True;api.write(folder/'report.json',report)
    return dict(body=json.dumps(report),summary=dict(count=1))
