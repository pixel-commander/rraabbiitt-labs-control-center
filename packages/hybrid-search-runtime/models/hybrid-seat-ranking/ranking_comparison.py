"""Compare checkpoints on one frozen catalog and saved held-out questions."""
import json
import numpy as np

def run_folder(api,options):
    folder=(api.ROOT/str(options.get('run',''))).resolve()
    if folder.parent!=(api.ROOT/'tuning').resolve() or not (folder/'dataset.json').is_file():
        raise ValueError('Select a saved tuning run')
    return folder

def compare(api,options):
    from established_runtime import State
    folder=run_folder(api,options);report=api.read(folder/'report.json');saved=api.read(folder/'dataset.json')
    if not report.get('checkpoint'): raise ValueError('Candidate checkpoint is not ready')
    baseline=api.checkpoint_folder();candidate=api.checkpoint_folder(report['checkpoint'])
    catalog=saved['catalog'];questions={}
    for row in saved['test']:
        if row.get('scope')=='record' and row['grade']>0:
            questions.setdefault(row['query'],set()).add(row['record_key'])
    if len(questions)>100: raise ValueError('Comparison is limited to 100 saved evaluation questions')
    before=State(api,baseline,catalog);after=State(api,candidate,catalog)
    results=[]
    try:
        for query,targets in questions.items():
            rankings=[]
            for state in (before,after):
                scored=state.score(query);order=[int(i) for i in np.argsort(-scored['scores'],kind='stable') if scored['scores'][i]>0]
                rank=next((i+1 for i,index in enumerate(order) if catalog[index]['record_key'] in targets),None)
                rankings.append(dict(rank=rank,top=[dict(id=catalog[i].get('id'),name=catalog[i].get('title') or catalog[i].get('name'),key=catalog[i]['record_key']) for i in order[:5]]))
            a,b=rankings
            delta=(a['rank'] or len(catalog)+1)-(b['rank'] or len(catalog)+1)
            results.append(dict(query=query,targets=sorted(targets),before=a,after=b,change='improved' if delta>0 else 'regressed' if delta<0 else 'unchanged'))
    finally:
        before.engine.close();after.engine.close()
    result=dict(baseline=str(baseline.relative_to(api.ROOT)),candidate=report['checkpoint'],catalog_count=len(catalog),questions=results,
        scope='Full ranking pipelines on the same frozen run catalog; positive whole-record grades withheld from weight updates only. Existing retrieval feedback remains active, so this is not an unseen-query generalization test. Unjudged answers are not labeled wrong.',
        note='No eligible whole-answer evaluation questions.' if not results else 'Compare both improvements and regressions before activation.')
    api.write(folder/'ranking-comparison.json',result)
    return result
