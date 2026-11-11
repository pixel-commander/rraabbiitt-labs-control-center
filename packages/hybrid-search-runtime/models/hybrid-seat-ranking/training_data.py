"""Read-only adaptation of legacy labels; inferred evidence is never user review."""
import hashlib
import json
import re
from pathlib import Path

STOP = set('a an the what whats is are does do i we you it this that to for of in on where how can me please find show with'.split())

def tokens(text):
    text=re.sub(r'([a-z0-9])([A-Z])',r'\1 \2',text).casefold()
    return set(re.findall(r'[^\W_]+',text))-STOP

def overlaps_reserved(query, reserved):
    q=tokens(query)
    return any(query.strip().casefold()==r['query'].strip().casefold() or
               len(q&tokens(r['query']))/max(1,len(q|tokens(r['query'])))>=.65 for r in reserved)

def adapt(source, catalog, feedback, positive_value):
    known={r['record_key']:r for r in catalog}
    files=[source/'train.json']+sorted((source/'candidates').glob('*.json'))
    reserved=json.loads((source/'evaluation.json').read_text(encoding='utf-8-sig')) if (source/'evaluation.json').exists() else []
    groups={}; excluded=[]; sources=[]
    for file in files:
        if not file.exists(): continue
        sources.append(dict(path=str(file),sha256=hashlib.sha256(file.read_bytes()).hexdigest()))
        for index,row in enumerate(json.loads(file.read_text(encoding='utf-8-sig'))):
            query=row['query'].strip(); q=tokens(query)
            if overlaps_reserved(query,reserved):
                excluded.append(dict(source=file.name,index=index,reason='reserved evaluation overlap')); continue
            keys=[key for key in row['positive_keys'] if key in known]
            missing=[key for key in row['positive_keys'] if key not in known]
            if missing: excluded.append(dict(source=file.name,index=index,reason='missing target',keys=missing))
            if not keys: continue
            group=groups.setdefault(query.casefold(),dict(query=query,positive_keys=[],provenance=[],review_status='pending'))
            group['positive_keys']=sorted(set(group['positive_keys'])|set(keys))
            group['provenance'].append(dict(source=file.name,index=index,origin=row.get('origin'),review_status=row.get('review_status','unreviewed')))
    # Explicit selected-record corrections supersede old labels for that query.
    for row in feedback:
        group=groups.get(row['query'].strip().casefold())
        if not group: continue
        targets=[r['record_key'] for r in catalog if (row.get('id') is not None and r.get('id')==row['id']) or (r.get(row['field'])==positive_value(row) and positive_value(row))]
        if targets:
            group['positive_keys']=sorted(set(targets))
            group['review_status']='approved'
            group['provenance'].append(dict(origin='user:field-feedback',field=row['field']))
    for group in groups.values():
        if group['review_status']=='approved': continue
        # Literal catalog values are source data. Interpretations/rephrases are
        # suggestions even when an older training file already included them.
        if all(any(group['query'].casefold()==str(known[key].get(field,'')).strip().casefold()
                   for field in ('name','title','description')) for key in group['positive_keys']):
            group['review_status']='source'
    judged={(r['query'].strip().casefold(),r['field']) for r in feedback}
    fields=[]; ambiguous=[]
    for row in groups.values():
        q=tokens(row['query']); supported=False
        for key in row['positive_keys']:
            record=known[key]
            for field in ('name','title','description'):
                if (row['query'].casefold(),field) in judged: continue
                value=record.get(field,''); v=tokens(value); common=q&v
                # Conservative lexical grounding. Semantic-only examples retain
                # record labels rather than guessing which field explained them.
                exact=bool(value) and value.strip().casefold() in row['query'].casefold()
                grounded=exact or len(common)>=2 and len(common)/max(1,len(v))>=.75
                if not grounded: continue
                fields.append(dict(query=row['query'],record_key=key,field=field,positive=value,
                    intent='describe',origin='legacy:field-evidence',review_status='pending',
                    evidence=dict(text=value,matched_words=sorted(common),method='exact field text or >=75% significant field-word coverage'),provenance=row['provenance']))
                supported=True
        if not supported: ambiguous.append(row['query'])
    records=list(groups.values())
    report=dict(record_examples=len(records),field_examples=len(fields),record_only=len(ambiguous),excluded=excluded,sources=sources,
                pending_records=sum(r['review_status']=='pending' for r in records),pending_fields=len(fields),
                note='Field labels are conservative inferred evidence, not human judgments. Record-only examples retain multi-positive labels.')
    return records,fields,report
