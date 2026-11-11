"""Read-only size inventory and atomic progress for hybrid training. No model imports."""
import json, os, sqlite3, time
from pathlib import Path
from contextlib import contextmanager, closing
_active = {}

def read(path, default=None):
    return json.loads(path.read_text(encoding='utf-8-sig')) if path.exists() else default

def size(path):
    if not path or not path.exists(): return 0
    seen=set(); total=0
    for file in ([path] if path.is_file() else path.rglob('*')):
        if file.is_file():
            resolved=file.resolve()
            if resolved not in seen: total+=file.stat().st_size;seen.add(resolved)
    return total

def inspect(root):
    root=Path(root);pointer=read(root/'checkpoints/active.json',{})
    checkpoint=pointer.get('checkpoint'); active=root/checkpoint if checkpoint else None
    engine=read(active/'engine.json',{}) if active else {}
    models=[]
    for name in ('model','reranker'):
        spec=engine.get('reranker' if name=='reranker' else 'model') or read(root/('data/pretrained/'+name+'.json'),{})
        path=root/spec['path'] if spec.get('path') else None
        models.append(dict(name=name,id=spec.get('model_id'),bytes=size(path),frozen=not str(spec.get('path','')).startswith('tuning')))
    rows=[];db=root/'data/feedback.sqlite'
    if db.exists():
        with closing(sqlite3.connect(db.as_uri()+'?mode=ro',uri=True,timeout=1)) as con:
            rows=[json.loads(r[0]) for r in con.execute('SELECT payload FROM feedback ORDER BY id')]
    latest={}
    for row in rows: latest[(row['query'].strip().casefold(),row['record_key'],row['field'])]=row
    counts={v:sum(r.get('vote')==v for r in latest.values()) for v in ('up','part','down')}
    status=read(root/'data/training-status.json',dict(status='idle',stage='idle'))
    from training_chunks import chunks
    chunk_list=[]
    for chunk in chunks(rows):
        chunk['path']=str(Path('data/training-chunks')/chunk['id']/chunk['version'])
        chunk['saved']=(root/chunk['path']/'examples.json').exists()
        chunk_list.append(chunk)
    runs=[]
    for path in sorted((root/'tuning').glob('*/report.json'),reverse=True):
        try: item=read(path,{})
        except json.JSONDecodeError: continue # Report writer may be replacing this snapshot; retry next poll.
        for field,file in [('loss_history','loss-history.json'),('gradient_history','gradient-history.json'),('comparison','ranking-comparison.json')]:
            item[field]=read(path.parent/file)
        inspections=sorted((path.parent/'attention-inspections').glob('*.json'),reverse=True)
        if inspections:
            item['attention']=read(inspections[0])
            item['attention']['file']=str(inspections[0].relative_to(root))
        item['candidate_bytes']=size(path.parent/'model')
        if item.get('landscape_file')=='landscape.json':
            item['landscape']=read(path.parent/'landscape.json')
        item['checkpoint_bytes']=size(root/item['checkpoint']) if item.get('checkpoint') else 0
        item['total_bytes']=models[0]['bytes']+item['candidate_bytes']+item['checkpoint_bytes']
        runs.append(item)
    new_folder=root/status['checkpoint'] if status.get('checkpoint') else active
    model_bytes=sum(m['bytes'] for m in models)
    report=read(active/'report.json',{}) if active else {}
    import retrieval
    from fine_tuning import tuning_dataset
    data=tuning_dataset(retrieval.established_api())
    ready=bool(data['train'] and data['test'])
    readiness=dict(ready=ready,train_examples=len(data['train']),test_examples=len(data['test']),
        query_families=data['groups'],reason='' if ready else
        'Grade answers to more different questions in Search. Training needs reviewed questions in both the training and test groups. Your saved feedback already improves search ranking.')
    return dict(readiness=readiness,status=status,models=models,active_checkpoint=checkpoint,active_report=report,
        sizes=dict(model_bytes=model_bytes,active_checkpoint_bytes=size(active),new_checkpoint_bytes=size(new_folder),
            active_total_bytes=model_bytes+size(active),new_total_bytes=model_bytes+size(new_folder),
            history_bytes=size(root/'checkpoints'),feedback_bytes=size(db)),
        feedback=dict(rows=len(rows),latest=len(latest),grades=counts),encoder_frozen=True,chunks=chunk_list,runs=runs)

def update(root, **values):
    key=str(root)
    if key not in _active: return
    state=_active[key];state.update(values);state['updated_at']=int(time.time()*1000)
    if values.get('status') in ('complete','error'): state['finished_at']=state['updated_at']
    folder=Path(root)/'data';folder.mkdir(parents=True,exist_ok=True)
    target=folder/'training-status.json';temp=folder/('training-status-'+str(os.getpid())+'.tmp')
    temp.write_text(json.dumps(state),encoding='utf8')
    # Windows can briefly deny replacement while a status reader has the file open.
    # Keep atomic replacement, with a bounded retry for that transient sharing lock.
    for attempt in range(10):
        try:
            temp.replace(target)
            break
        except PermissionError:
            if attempt==9: raise
            time.sleep(.02*(attempt+1))

@contextmanager
def session(root, operation, settings):
    folder=Path(root)/'data';folder.mkdir(parents=True,exist_ok=True)
    lock=open(folder/'training.lock','a+b');lock.seek(0);lock.write(b'0');lock.flush();lock.seek(0)
    try:
        if os.name=='nt':
            import msvcrt
            msvcrt.locking(lock.fileno(),msvcrt.LK_NBLCK,1)
        else:
            import fcntl
            fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
    except OSError:
        lock.close();raise ValueError('Training is already running')
    key=str(root)
    try:
        before=inspect(root)
        _active[key]=dict(status='running',stage='preparing',operation=operation,pid=os.getpid(),started_at=int(time.time()*1000),
            query=settings.get('query'),record=settings.get('path'),field=settings.get('name'),
            before_checkpoint=before['active_checkpoint'],before_sizes=before['sizes'],mode='live')
        update(root)
        yield
    except Exception as error:
        update(root,status='error',stage='failed',error=str(error));raise
    finally:
        _active.pop(key,None)
        if os.name=='nt':
            import msvcrt
            lock.seek(0);msvcrt.locking(lock.fileno(),msvcrt.LK_UNLCK,1)
        lock.close()
