$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonExe = Join-Path $projectRoot ".venv\Scripts\python.exe"
Push-Location $projectRoot
try {
  if (-not (Get-Command python -ErrorAction SilentlyContinue)) { throw "Python 3.10 or newer is required." }
  $version = python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"
  $parts = $version.Split('.') | ForEach-Object { [int]$_ }
  if ($parts[0] -lt 3 -or ($parts[0] -eq 3 -and $parts[1] -lt 10)) { throw "Python 3.10 or newer is required. Detected $version." }
  if (-not (Test-Path .venv)) { python -m venv .venv }
  & .\.venv\Scripts\python.exe -m pip install --upgrade pip
  if ($LASTEXITCODE -ne 0) { throw "Could not upgrade pip." }
  & $pythonExe -m pip install -r requirements.txt
  if ($LASTEXITCODE -ne 0) { throw "Could not install portable ranker dependencies." }
  $env:HF_HOME = Join-Path $projectRoot "models\hf-cache"
  $downloadScript = @'
from sentence_transformers import SentenceTransformer
from transformers import AutoModelForSequenceClassification, AutoTokenizer

SentenceTransformer(
    "sentence-transformers/multi-qa-MiniLM-L6-cos-v1",
    revision="b207367332321f8e44f96e224ef15bc607f4dbf0",
)
model = "cross-encoder/ms-marco-MiniLM-L6-v2"
revision = "233902d25c440f23af6f7d6e94d2946bac0bee0a"
AutoTokenizer.from_pretrained(model, revision=revision)
AutoModelForSequenceClassification.from_pretrained(model, revision=revision)
'@
  Write-Host "Downloading the pinned search encoder and base CrossEncoder..."
  $downloadScript | & $pythonExe -
  if ($LASTEXITCODE -ne 0) { throw "Could not download the pinned search models." }
  Write-Host "Environment and base search models are ready. Add reviewed examples before training."
} finally { Pop-Location }
