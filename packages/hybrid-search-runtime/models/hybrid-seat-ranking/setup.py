"""Install the pinned encoder assets; run with this model's configured Python."""
import hashlib
import json
from pathlib import Path
from huggingface_hub import snapshot_download

ROOT=Path(__file__).resolve().parent
MODEL='sentence-transformers/multi-qa-MiniLM-L6-cos-v1'
REVISION='b207367332321f8e44f96e224ef15bc607f4dbf0'

def install(model_id,revision,filename,dimensions=None):
    destination=ROOT/'data/pretrained'
    location=Path(snapshot_download(model_id,revision=revision,cache_dir=str(destination),
        allow_patterns=['*.json','*.txt','*.safetensors','README.md','LICENSE*'],
        ignore_patterns=['onnx/*','openvino/*'],token=False))
    files={p.relative_to(location).as_posix():hashlib.sha256(p.read_bytes()).hexdigest()
           for p in sorted(location.rglob('*')) if p.is_file()}
    config=dict(model_id=model_id,revision=revision,path=location.relative_to(ROOT).as_posix(),file_sha256=files)
    if dimensions is not None: config['dimensions']=dimensions
    temporary=destination/(filename+'.tmp')
    temporary.write_text(json.dumps(config,indent=2)+'\n',encoding='utf-8')
    temporary.replace(destination/filename)
    print(json.dumps(dict(model_id=model_id,revision=revision,verified_files=len(files))))


if __name__=='__main__':
    install(MODEL,REVISION,'model.json',384)
    install('cross-encoder/ms-marco-MiniLM-L6-v2','233902d25c440f23af6f7d6e94d2946bac0bee0a','reranker.json')
