"""Shared tool contract and a process lock for all seat mutations."""
import json, os
from pathlib import Path
from . import lessons, model

def dispatch(operation,settings,root=lessons.ROOT):
    lock=None
    try:
        options=json.loads(settings.get('content','{}'))
        if not isinstance(options,dict):raise ValueError('content must be an object')
        action=settings.get('name','status')
        writing=operation=='save-seat-lesson' or (operation=='train-seat-model' and action in ('train','activate'))
        if writing:
            Path(root).mkdir(parents=True,exist_ok=True);lock=Path(root)/'.write.lock'
            try:fd=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY)
            except FileExistsError:lock=None;raise ValueError('Seat data is busy. Retry after the current operation finishes.')
            os.close(fd)
        if operation=='save-seat-lesson':result=lessons.save(settings,root)
        elif operation=='predict-seats':
            query=settings.get('query')
            if not isinstance(query,str) or not query.strip() or len(query)>2000:raise ValueError('Supply query of 1–2000 characters')
            loaded=model.load(root,options.get('checkpoint'))
            result=model.predict(loaded,query) if loaded else dict(status='untrained',seats={},spans=[],unresolved=[])
        elif operation=='train-seat-model':
            if action=='train':result=model.train(root,options.get('epochs',100))
            elif action=='activate':result=model.activate(root,options.get('checkpoint'))
            elif action in ('status','evaluate'):
                if action=='evaluate':
                    from .evaluate import evaluate
                    loaded=model.load(root,options.get('checkpoint'))
                    if loaded is None:raise ValueError('No active model')
                    result=evaluate(loaded,[r for r in lessons.latest(root) if r['split']=='test'])
                else:
                    pointer=Path(root)/'checkpoints/active.json'
                    result=dict(lessons=lessons.latest(root),active=json.loads(pointer.read_text()) if pointer.exists() else None,
                        candidates=[json.loads(p.read_text()) for p in sorted((Path(root)/'checkpoints').glob('*/report.json'),reverse=True)])
            else:raise ValueError('Unknown seat training operation')
        else:raise ValueError('Unknown seat tool')
        return dict(status='complete',settings=settings,response=dict(body=json.dumps(result),summary=dict(count=1)))
    except Exception as error:return dict(status='error',settings=settings,error=str(error))
    finally:
        if lock is not None:lock.unlink(missing_ok=True)

def main(operation):
    import sys
    sys.stdin.reconfigure(encoding='utf-8');sys.stdout.reconfigure(encoding='utf-8')
    settings={}
    try:settings=json.load(sys.stdin);result=dispatch(operation,settings)
    except Exception as error:result=dict(status='error',settings=settings,error=str(error))
    print(json.dumps(result))
