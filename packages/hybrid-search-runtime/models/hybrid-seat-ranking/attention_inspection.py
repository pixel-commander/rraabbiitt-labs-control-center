"""On-demand, bounded attention inspection; never alters serving weights."""
import time
import torch
from transformers import AutoModelForSequenceClassification,AutoTokenizer
from ranking_comparison import run_folder

def inspect_attention(api,options):
    from pretrained_encoder import reranker
    folder=run_folder(api,options);report=api.read(folder/'report.json')
    query=options.get('query','');document=options.get('document','')
    if not isinstance(query,str) or not isinstance(document,str) or not query.strip() or not document.strip() or len(query)+len(document)>6000:
        raise ValueError('Supply a question and answer, up to 6000 characters combined')
    source=options.get('source','candidate')
    if source not in ('candidate','active'): raise ValueError('source must be candidate or active')
    spec=report.get('model') if source=='candidate' else api.read(api.checkpoint_folder()/'engine.json')['reranker']
    if not spec: raise ValueError('Candidate model is not ready')
    reranker(api.ROOT,spec) # Verify the pinned manifest before opening a separate eager instance.
    path=str(api.ROOT/spec['path'])
    model=AutoModelForSequenceClassification.from_pretrained(path,local_files_only=True,trust_remote_code=False,attn_implementation='eager')
    tokenizer=AutoTokenizer.from_pretrained(path,local_files_only=True,trust_remote_code=False)
    layer=options.get('layer',0);head=options.get('head',0)
    if type(layer)!=int or type(head)!=int or not 0<=layer<model.config.num_hidden_layers or not 0<=head<model.config.num_attention_heads:
        raise ValueError(f'Layer must be 0–{model.config.num_hidden_layers-1}; head 0–{model.config.num_attention_heads-1}')
    original_length=len(tokenizer(query,document)['input_ids'])
    tokens=tokenizer(query,document,truncation=True,max_length=128,return_tensors='pt')
    model.eval()
    with torch.no_grad(): output=model(**tokens,output_attentions=True)
    if output.attentions is None: raise ValueError('This model did not return attention weights')
    result=dict(query=query,document=document,source=source,model=spec['model_id'],revision=spec['revision'],layer=layer,head=head,
        layer_count=model.config.num_hidden_layers,head_count=model.config.num_attention_heads,
        tokens=tokenizer.convert_ids_to_tokens(tokens['input_ids'][0].tolist()),matrix=output.attentions[layer][0,head].tolist(),
        truncated=original_length>128,original_tokens=original_length,token_limit=128,
        note='Rows attend to columns. Attention weights are not causal explanations or proof of understanding.')
    target=folder/'attention-inspections'/f'{time.time_ns()}.json';api.write(target,result)
    result['file']=str(target.relative_to(api.ROOT));return result
