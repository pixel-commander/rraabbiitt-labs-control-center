# Portable ranker

This folder is a self-contained portable search/reranking starter. `search.py` runs per-field BM25 plus frozen sentence-embedding retrieval, combines those rankings and exact approved field feedback with reciprocal-rank fusion, then reranks the shortlist with a CrossEncoder. `train.py` trains a fresh CrossEncoder candidate from the Hybrid Seat Ranking project's pinned pretrained reranker using reviewed query/document relevance grades. It reads a JSON catalog and its own empty JSONL files, without needing the Hybrid Search repo, its SQLite database, MCP, or any copied checkpoints. It does not replace or edit the original Hybrid Seat Ranking system.

“Fresh training” here means a new candidate initialized from the pinned pretrained weights and trained only with the dataset you supply. Randomly initializing a transformer would require a much larger corpus and is not a useful default. The script never promotes or overwrites another model. Training and scoring default to CUDA when the installed PyTorch can see a GPU, otherwise CPU.

## Install on Windows

Install Python 3.10+ first, then run:

```powershell
cd portable-ranker
./setup.ps1
```

`setup.ps1` makes a private `.venv`, installs the requirements, and downloads the exact pinned sentence encoder and base reranker revisions from Hugging Face into `models/hf-cache` inside this folder. Training starts from the base reranker and saves a separate candidate in `models/candidate`. For an NVIDIA GPU, install the PyTorch wheel matching that computer's CUDA driver before running setup; CPU remains supported. The scripts make no assumption about the computer's GPU model.

## Prepare reviewed data

Each non-empty line of `data/train.jsonl` is one query/candidate judgment:

```json
{"query":"find the chat settings page","document":"Type: page\nName: chat-settings\nTitle: Chat settings\nDescription: Configure model and conversation behavior","grade":1}
```

Use `grade: 1` for a correct match, `grade: 0` for a clearly wrong match, and a value between them for a partial match. Include both correct and wrong candidates for each useful query. The script requires at least four pairs and two distinct queries. It holds out entire query groups for validation to avoid testing on a paraphrase of a training query. `examples/training.example.jsonl` is a tiny schema example, not a validated benchmark; copy/edit it into `data/train.jsonl` only after reviewing each label.

Approved exact-query field feedback can be added separately to `data/feedback.jsonl`; see `data/README.md` for its fields. Unapproved rows are ignored. The standalone tool does not guess rephrases or turn candidate training examples into approved search feedback.

## Train and rank

```powershell
.\.venv\Scripts\python.exe train.py --data data/train.jsonl --output models/candidate --epochs 2
.\.venv\Scripts\python.exe rank.py "find the chat settings page" examples/candidates.json --model models/candidate
.\.venv\Scripts\python.exe search.py "find the chat settings page" --catalog data/catalog.example.json --base
.\.venv\Scripts\python.exe search.py "find the chat settings page" --catalog data/catalog.example.json --model models/candidate
```

The rank command expects a JSON array like:

```json
[
  {"id": 17, "document": "Type: page\nName: chat-settings\nTitle: Chat settings\nDescription: Configure model behavior"},
  {"id": 22, "document": "Type: page\nName: billing-history\nTitle: Billing history\nDescription: Review invoices"}
]
```

`rank.py` returns supplied candidate records sorted by raw model logit. `search.py` first retrieves from the JSON catalog by BM25 and semantic ranks per field, fuses those field ranks with reciprocal-rank fusion, then reranks the shortlist. To use the pinned baseline without training, pass `--base`. All raw logits are ranking scores, not calibrated probabilities. The training report records the dataset SHA-256, query-group split, initial/final validation BCE, device, and candidate-only status. A lower validation loss alone is not approval to deploy; compare the candidate against the baseline on additional human-reviewed queries before connecting it to an app.

## Portability boundaries

- Copy this folder to another machine and run setup there. Keep `.venv/` and Python cache folders local; rebuild the environment for that machine. The `models/hf-cache/` directory makes downloaded base weights portable with the folder and can be large; `models/candidate/` contains your trained candidate.
- For an offline transfer, run a base search once and train the candidate first, then copy `models/hf-cache/`, `models/candidate/`, the catalog, and reviewed dataset. On the receiving machine set `$env:HF_HUB_OFFLINE = "1"` before running search. Install a matching Python/PyTorch environment on that machine; virtual environments are not portable between computers.
- `data/train.jsonl` and `data/feedback.jsonl` are intentionally blank. Start with reviewed examples; the sample file is only a format guide.
- The app database and `rab_world` remain separate from this utility. MCP connection and tool linking are configured in the app's MCP page.
- The original `C:\hybrid-search-model` and `C:\rraabbiitt-react-components` folders are not modified by this portable package.
