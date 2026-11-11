"""Exact spans include both seat and canonical label; no training here."""
from .model import predict, examples

def evaluate(model,rows):
    if rows:examples(rows) # Validate annotation boundaries too.
    groups={}
    for row in rows:groups.setdefault(row['sentence'],[]).append(row)
    tp=fp=fn=exact=0;per_seat={}
    for sentence,annotations in groups.items():
        complete={r['seat'] for r in annotations if r['complete']}
        # Only complete seats support unbiased extraction evaluation.
        if not complete:continue
        gold={(r['seat'],r['label'],r['start'],r['end']) for r in annotations if r['seat'] in complete and r['label']!='__none__'}
        found={(r['seat'],r['label'],r['start'],r['end']) for r in predict(model,sentence)['spans'] if r['seat'] in complete}
        tp+=len(gold&found);fp+=len(found-gold);fn+=len(gold-found);exact+=gold==found
        for seat in complete:
            g={r for r in gold if r[0]==seat};f={r for r in found if r[0]==seat};counts=per_seat.setdefault(seat,{'tp':0,'fp':0,'fn':0})
            counts['tp']+=len(g&f);counts['fp']+=len(f-g);counts['fn']+=len(g-f)
    count=sum(any(r['complete'] for r in a) for a in groups.values())
    return dict(sentences=count,span_f1=2*tp/max(1,2*tp+fp+fn),exact=exact/max(1,count),tp=tp,fp=fp,fn=fn,per_seat=per_seat)
