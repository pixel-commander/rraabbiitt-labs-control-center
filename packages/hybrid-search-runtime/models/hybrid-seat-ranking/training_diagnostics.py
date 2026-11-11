"""Fixed-set evaluation and bounded, deterministic gradient samples."""
import re
import torch

def measure_loss(model,rows):
    was_training=model.model.training
    try:
        model.model.eval();total=0.
        with torch.no_grad():
            for offset in range(0,len(rows),4):
                batch=rows[offset:offset+4]
                tokens=model.tokenizer([r['query'] for r in batch],[r['document'] for r in batch],padding=True,truncation=True,max_length=512,return_tensors='pt')
                logits=model.model(**tokens).logits.reshape(-1)
                loss=torch.nn.functional.binary_cross_entropy_with_logits(logits,torch.tensor([r['grade'] for r in batch]),reduction='sum')
                total+=float(loss)
        return total/len(rows) if rows else None
    finally: model.model.train(was_training)

def gradient_snapshot(model,step):
    groups={}
    for name,param in model.named_parameters():
        if param.grad is None: continue
        match=re.search(r'encoder\.layer\.(\d+)',name)
        layer=('layer '+match.group(1)) if match else 'embeddings' if 'embeddings' in name else 'output / other'
        groups.setdefault(layer,[]).append(param.grad.detach().reshape(-1))
    layers=[]
    for name,parts in groups.items():
        values=torch.cat(parts);n=values.numel()
        sample=values[torch.linspace(0,n-1,min(2048,n)).long()]
        if not torch.isfinite(sample).all(): raise ValueError('Non-finite gradients')
        # Common log-magnitude bins allow honest layer comparisons, including zeros.
        magnitude=torch.log10(sample.abs().clamp_min(1e-12)).clamp(-12,0)
        bins=torch.histc(magnitude,bins=24,min=-12,max=0).tolist()
        layers.append(dict(name=name,count=n,sampled=len(sample),bins=bins,norm=float(torch.linalg.vector_norm(values)),zero_fraction=float((sample==0).float().mean())))
    return dict(step=step,layers=layers,bin_min=-12,bin_max=0,measurement='Sampled absolute gradients before clipping; log10 magnitude; values outside range clamped')
