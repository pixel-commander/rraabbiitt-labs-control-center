"""Append-only annotations. Offsets are browser UTF-16 units on input."""
import json, sqlite3, hashlib, re
from contextlib import closing
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()

def rows(root=ROOT):
    file = Path(root)/'data/lessons.sqlite'
    if not file.exists(): return []
    with closing(sqlite3.connect(file)) as db:
        return [json.loads(r[0]) for r in db.execute('SELECT payload FROM lessons ORDER BY id')]

def latest(root=ROOT):
    result = {}
    for row in rows(root): result[(row['sentence'], row['seat'], row['start'], row['end'])] = row
    return list(result.values())

def save(settings, root=ROOT):
    sentence, seat, label = settings.get('query'), settings.get('name'), settings.get('title')
    options = json.loads(settings.get('content', '{}'))
    if not isinstance(options, dict): raise ValueError('content must be an object')
    if not isinstance(sentence, str) or not sentence.strip() or len(sentence)>2000: raise ValueError('Supply a sentence of 1–2000 characters')
    if not isinstance(seat,str) or not re.fullmatch(r'[a-z][a-z0-9_]{0,39}',seat): raise ValueError('Seat must be a lowercase identifier')
    if not isinstance(label,str) or not label.strip() or len(label)>100: raise ValueError('Supply a canonical label, or __none__')
    start,end = options.get('start'), options.get('end')
    if type(start) is not int or type(end) is not int or not 0<=start<end: raise ValueError('Supply UTF-16 start/end offsets')
    encoded=sentence.encode('utf-16-le')
    if end*2>len(encoded): raise ValueError('Selection exceeds sentence')
    try:
        prefix=encoded[:start*2].decode('utf-16-le'); phrase=encoded[start*2:end*2].decode('utf-16-le')
    except UnicodeDecodeError: raise ValueError('Selection splits a Unicode character')
    if phrase!=options.get('text') or not phrase.strip(): raise ValueError('Highlighted text does not match offsets')
    from .model import tokens
    ts=tokens(sentence);a=len(prefix);b=a+len(phrase)
    if a not in {t[1] for t in ts} or b not in {t[2] for t in ts}:raise ValueError('Highlight whole tokens; selection cuts a word')
    split=options.get('split','train'); group=options.get('group',sentence.casefold().strip())
    if split not in ('train','test') or not isinstance(group,str) or not group.strip(): raise ValueError('Supply train/test split and family')
    complete=options.get('complete',False)
    if type(complete) is not bool: raise ValueError('complete must be boolean')
    context=options.get('context',{})
    if not isinstance(context,dict): raise ValueError('context must be an object')
    row=dict(sentence=sentence,seat=seat,label=label.strip(),start=len(prefix),end=len(prefix)+len(phrase),text=phrase,
             split=split,group=group.strip().casefold(),complete=complete,context=context,
             origin='user:seat-annotation',review_status='approved')
    file=Path(root)/'data/lessons.sqlite';file.parent.mkdir(parents=True,exist_ok=True)
    with closing(sqlite3.connect(file,timeout=30)) as db:
        db.execute('CREATE TABLE IF NOT EXISTS lessons(id INTEGER PRIMARY KEY,payload TEXT NOT NULL)')
        db.execute('BEGIN IMMEDIATE')
        old=[json.loads(r[0]) for r in db.execute('SELECT payload FROM lessons')]
        if any((r['group']==row['group'] or r['sentence'].casefold()==sentence.casefold()) and r['split']!=split for r in old):
            raise ValueError('A sentence/rephrase family cannot cross train/test splits')
        for r in old:
            same=(r['sentence']==sentence and r['seat']==seat)
            if same and (r['start'],r['end'])!=(row['start'],row['end']) and max(r['start'],row['start'])<min(r['end'],row['end']):
                raise ValueError('Overlapping annotations for the same seat are not supported')
        cursor=db.execute('INSERT INTO lessons(payload) VALUES(?)',(json.dumps(row),));row['id']=cursor.lastrowid
        db.commit()
    return row
