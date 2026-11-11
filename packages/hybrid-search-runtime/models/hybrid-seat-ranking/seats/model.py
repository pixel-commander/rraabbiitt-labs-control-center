"""Small per-seat BIO softmax taggers, trained from spans and canonical labels.

No pretrained assets or external Python packages. Unannotated tokens are masked
unless the teacher explicitly marks the sentence complete for that seat.
"""
import json, math, random, re, time
from pathlib import Path
from .lessons import ROOT, latest, digest

def tokens(text):
    return [(m.group().casefold(),m.start(),m.end()) for m in re.finditer(r'\w+(?:[-\u0027]\w+)*|[^\w\s]',text)]

def features(ts,i):
    word=ts[i][0];before=ts[i-1][0] if i else '^';after=ts[i+1][0] if i+1<len(ts) else '$'
    return {'bias':1.,'word:'+word:1.,'before:'+before:.5,'after:'+after:.5,
            'pair:'+before+' '+word:.5,'pair:'+word+' '+after:.5}

def probabilities(weights,labels,fs):
    scores=[sum(weights.get(k,{}).get(label,0.)*v for k,v in fs.items()) for label in labels]
    peak=max(scores);ex=[math.exp(v-peak) for v in scores];total=sum(ex)
    return [v/total for v in ex]

def examples(rows):
    grouped={}
    for row in rows: grouped.setdefault((row['sentence'],row['seat']),[]).append(row)
    result=[]
    for (sentence,seat),annotations in grouped.items():
        ts=tokens(sentence); tags=['O' if any(a['complete'] for a in annotations) else None for _ in ts]
        for a in annotations:
            indexes=[i for i,t in enumerate(ts) if t[1]>=a['start'] and t[2]<=a['end']]
            if not indexes or ts[indexes[0]][1]!=a['start'] or ts[indexes[-1]][2]!=a['end']:
                raise ValueError('Highlight whole tokens; selection cuts a word')
            for j,i in enumerate(indexes): tags[i]='O' if a['label']=='__none__' else ('B:' if j==0 else 'I:')+a['label']
        result.append((sentence,seat,ts,tags))
    return result

def fit(rows,epochs=100):
    model={'schema':1,'seats':{}};data=examples(rows)
    for seat in sorted({r['seat'] for r in rows}):
        samples=[(features(ts,i),tag) for _,s,ts,tags in data if s==seat for i,tag in enumerate(tags) if tag is not None]
        labels=sorted({tag for _,tag in samples})
        if 'O' not in labels or not any(t.startswith('B:') for t in labels):
            raise ValueError('Each seat needs labeled spans and explicit negative tokens (complete annotation or __none__)')
        weights={};rng=random.Random(42)
        for _ in range(epochs):
            rng.shuffle(samples)
            for fs,target in samples:
                ps=probabilities(weights,labels,fs)
                for key,value in fs.items():
                    row=weights.setdefault(key,{})
                    for label,p in zip(labels,ps):row[label]=row.get(label,0.)+.12*((label==target)-p)*value-.0001*row.get(label,0.)
        model['seats'][seat]={'labels':labels,'weights':weights,'tokens':len(samples)}
    return model

def predict(model,text):
    ts=tokens(text);spans=[]
    for seat,head in model['seats'].items():
        current=None
        for i,(word,start,end) in enumerate(ts):
            fs=features(ts,i);ps=probabilities(head['weights'],head['labels'],fs)
            best=max(range(len(ps)),key=ps.__getitem__);tag=head['labels'][best];score=ps[best]
            # Unknown tokens do not acquire a seat from bias alone.
            if 'word:'+word not in head['weights'] or score<.55:tag='O'
            if tag=='O':current=None;continue
            label=tag[2:]
            if tag.startswith('I:') and current and current['label']==label:
                current['end']=end;current['text']=text[current['start']:end];current['score']=min(current['score'],score)
            elif tag.startswith('B:'):
                current=dict(seat=seat,label=label,start=start,end=end,text=text[start:end],score=score);spans.append(current)
            else:current=None
    return {'spans':spans,'offset_unit':'unicode-code-point','score_kind':'uncalibrated softmax; minimum token score',
            'seats':{s: next(iter(values)) for s in model['seats'] if len(values:={p['label'] for p in spans if p['seat']==s})==1},
            'unresolved':[s for s in model['seats'] if len({p['label'] for p in spans if p['seat']==s})!=1]}

def folder(root,version):
    if not isinstance(version,str) or not re.fullmatch(r'\d+',version):raise ValueError('Invalid checkpoint version')
    return Path(root)/'checkpoints'/version

def load(root=ROOT,version=None):
    pointer=Path(root)/'checkpoints/active.json'
    if version is None:
        if not pointer.exists():return None
        version=json.loads(pointer.read_text())['version']
    p=folder(root,version);model=json.loads((p/'model.json').read_text());report=json.loads((p/'report.json').read_text())
    if digest(model)!=report['model_hash']:raise ValueError('Checkpoint integrity mismatch')
    return model

def train(root=ROOT,epochs=100):
    if type(epochs) is not int or not 1<=epochs<=500:raise ValueError('epochs must be 1–500')
    rows=latest(root);training=[r for r in rows if r['split']=='train'];testing=[r for r in rows if r['split']=='test']
    if not training:raise ValueError('Save training annotations first')
    model=fit(training,epochs)
    from .evaluate import evaluate
    evaluation=evaluate(model,testing);baseline=load(root)
    before=evaluate(baseline,testing) if baseline else None
    evaluated_seats={r['seat'] for r in testing if r['complete']}
    families={r['group'] for r in testing if r['complete']}
    passed=bool(len(families)>=3 and set(model['seats'])<=evaluated_seats and evaluation['span_f1']>=.8 and evaluation['exact']>=.8 and
                (before is None or evaluation['span_f1']>=before['span_f1']))
    version=str(time.time_ns());p=folder(root,version);p.mkdir(parents=True)
    report=dict(version=version,epochs=epochs,model_hash=digest(model),dataset_hash=digest(rows),parent_hash=digest(baseline),evaluation=evaluation,baseline=before,
                gate={'passed':passed,'rule':'At least 3 held-out families, every seat evaluated, span F1 and exact match >= 0.8, no span F1 regression'},activated=False)
    for name,value in [('model',model),('dataset',rows),('report',report)]:
        (p/(name+'.json')).write_text(json.dumps(value,indent=2),encoding='utf-8')
    return report

def activate(root,version):
    p=folder(root,version);report=json.loads((p/'report.json').read_text());load(root,version)
    if not report['gate']['passed']:raise ValueError('Candidate has not passed evaluation')
    if digest(load(root))!=report['parent_hash']:raise ValueError('Active model changed; train a fresh candidate')
    if digest(latest(root))!=report['dataset_hash']:raise ValueError('Lessons changed; train a fresh candidate')
    if digest(json.loads((p/'dataset.json').read_text()))!=report['dataset_hash']:raise ValueError('Dataset integrity mismatch')
    pointer=Path(root)/'checkpoints/active.json';temp=pointer.with_suffix('.tmp');temp.write_text(json.dumps({'version':version}));temp.replace(pointer)
    return {'activated':version}
