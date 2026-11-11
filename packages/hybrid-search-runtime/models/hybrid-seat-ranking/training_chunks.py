"""Versioned, retained feedback chunks. Reading never mutates feedback history."""
import hashlib
import json
from pathlib import Path

def digest(value):
    return hashlib.sha256(json.dumps(value,sort_keys=True,ensure_ascii=False).encode()).hexdigest()

def source_type(row):
    origin=row.get('origin','')
    if row.get('type') in ('user','llm','model'): return row['type']
    return 'user' if origin.startswith('user') else 'llm' if origin.startswith(('llm','assistant')) else 'model' if origin.startswith('model') else 'unknown'

def chunks(rows):
    groups={}
    for row in rows:
        key=(source_type(row),row.get('group_query',row['query']).strip().casefold())
        groups.setdefault(key,[]).append(row)
    result=[]
    for (kind,group),examples in groups.items():
        content=[dict(row,grade={'up':1.,'part':.5,'down':0.}.get(row.get('vote')),type=kind) for row in examples]
        ident=digest([kind,group])[:20];version=digest(content)
        result.append(dict(id=ident,name='training-'+ident,title=examples[0].get('group_query',examples[0]['query']),
            description='Retained field judgments, corrections and rephrases for this question group.',type=kind,
            version=version,count=len(content),review_status='approved' if all(r.get('review_status')=='approved' for r in examples) else 'pending',
            grades={vote:sum(r.get('vote')==vote for r in examples) for vote in ('up','part','down')},examples=content))
    return result

def save(root,rows):
    result=[]
    for chunk in chunks(rows):
        folder=Path(root)/'data/training-chunks'/chunk['id']/chunk['version']
        folder.mkdir(parents=True,exist_ok=True)
        examples=chunk['examples'];metadata={k:v for k,v in chunk.items() if k!='examples'}
        for name,value in [('examples.json',examples),('chunk.json',metadata)]:
            path=folder/name
            # Immutable content-addressed version; never overwrite an old version.
            encoded=json.dumps(value,indent=2,ensure_ascii=False)
            if path.exists():
                if json.loads(path.read_text(encoding='utf8'))!=value: raise ValueError('Training chunk integrity mismatch')
            else: path.write_text(encoded,encoding='utf8')
        result.append(dict(metadata,path=str(folder.relative_to(root))))
    return result
