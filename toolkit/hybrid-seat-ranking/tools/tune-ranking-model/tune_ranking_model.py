import contextlib
import json
import sys
from pathlib import Path
root=Path(__file__).resolve().parents[4]/'models/hybrid-seat-ranking'
sys.path.insert(0,str(root))
settings={}
try:
    settings=json.load(sys.stdin)
    with contextlib.redirect_stdout(sys.stderr):
        if settings.get('name','fine-tune')=='status':
            from training_status import inspect
            result=dict(status='complete',settings=settings,response=dict(body=json.dumps(inspect(root))))
        elif settings.get('name') in ('compare','attention'):
            import retrieval as api
            options=json.loads(settings.get('content') or '{}')
            if settings['name']=='compare':
                from ranking_comparison import compare
                data=compare(api,options)
            else:
                from attention_inspection import inspect_attention
                data=inspect_attention(api,options)
            result=dict(status='complete',settings=settings,response=dict(body=json.dumps(data)))
        else:
            from retrieval import dispatch
            operation=settings.get('name','fine-tune')
            if operation not in ('fine-tune','activate'): raise ValueError('name must be status, fine-tune or activate')
            result=dispatch(operation,settings)
except Exception as error:
    result=dict(status='error',settings=settings,error=str(error))
print(json.dumps(result))
