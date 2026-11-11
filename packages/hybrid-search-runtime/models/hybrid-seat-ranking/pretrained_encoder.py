"""Pinned, local-only Sentence Transformers encoder, shared by search and training."""
import json
import hashlib
from functools import lru_cache
from pathlib import Path


def model_spec(root):
    path = Path(root) / 'data/pretrained/model.json'
    if not path.is_file():
        raise RuntimeError('Pretrained encoder is not installed. Follow this model README setup instructions.')
    spec = json.loads(path.read_text(encoding='utf-8'))
    location = (Path(root) / spec['path']).resolve()
    if not location.is_relative_to(Path(root).resolve()) or not location.is_dir():
        raise ValueError('Pretrained model path must exist inside this model folder')
    return spec


@lru_cache(maxsize=2)
def _model(location, manifest, kind='encoder'):
    hashes=json.loads(manifest)
    if not hashes:
        raise RuntimeError('Encoder checkpoint lacks an asset manifest. Run setup.py and rebuild the candidate.')
    root=Path(location)
    for name,expected in hashes.items():
        source=(root/name).resolve()
        if not source.is_relative_to(root.resolve()) or not source.is_file():
            raise RuntimeError(f'Missing pinned encoder asset: {name}')
        if hashlib.sha256(source.read_bytes()).hexdigest()!=expected:
            raise RuntimeError(f'Pinned encoder asset failed SHA-256 verification: {name}')
    import torch
    from sentence_transformers import SentenceTransformer, CrossEncoder
    torch.set_num_threads(2)
    implementation=CrossEncoder if kind=='reranker' else SentenceTransformer
    return implementation(location, device='cpu', local_files_only=True, trust_remote_code=False)


def encoder(root, spec=None):
    root = Path(root).resolve()
    spec = model_spec(root) if spec is None else spec
    location = (root / spec['path']).resolve()
    if not location.is_relative_to(root):
        raise ValueError('Pretrained model path escapes model folder')
    model = _model(str(location),json.dumps(spec.get('file_sha256',{}),sort_keys=True))

    def encode(texts):
        return model.encode(list(texts), batch_size=32, normalize_embeddings=True,
                            convert_to_numpy=True, show_progress_bar=False)
    return encode


def reranker(root,spec):
    location=(Path(root)/spec['path']).resolve()
    if not location.is_relative_to(Path(root).resolve()):
        raise ValueError('Reranker path escapes model folder')
    return _model(str(location),json.dumps(spec.get('file_sha256',{}),sort_keys=True),'reranker')
