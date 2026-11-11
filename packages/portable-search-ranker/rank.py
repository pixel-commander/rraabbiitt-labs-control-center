"""Rank a JSON array of {id, document} candidates for one query."""
import argparse
import json
import os
from pathlib import Path

os.environ.setdefault("HF_HOME", str(Path(__file__).resolve().parent / "models" / "hf-cache"))

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

BASE_MODEL = "cross-encoder/ms-marco-MiniLM-L6-v2"
BASE_REVISION = "233902d25c440f23af6f7d6e94d2946bac0bee0a"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("query")
    parser.add_argument("candidates", help="JSON file containing an array of {id, document} records")
    parser.add_argument("--model", default="models/candidate", help="Trained candidate directory; use --base to score with the pinned base model")
    parser.add_argument("--base", action="store_true", help="Use the pinned base model rather than the trained candidate")
    parser.add_argument("--device", choices=("auto", "cpu", "cuda"), default="auto")
    args = parser.parse_args()
    rows = json.loads(Path(args.candidates).read_text(encoding="utf-8-sig"))
    if not isinstance(rows, list) or any(not isinstance(row.get("document"), str) for row in rows):
        raise ValueError("Candidates must be a JSON array with a string document field on every item.")
    device = "cuda" if args.device == "auto" and torch.cuda.is_available() else ("cpu" if args.device == "auto" else args.device)
    source = BASE_MODEL if args.base else str(Path(args.model))
    kwargs = {"revision": BASE_REVISION} if args.base else {}
    tokenizer = AutoTokenizer.from_pretrained(source, **kwargs)
    model = AutoModelForSequenceClassification.from_pretrained(source, **kwargs).to(device).eval()
    encoded = tokenizer([args.query] * len(rows), [row["document"] for row in rows], padding=True, truncation=True, max_length=512, return_tensors="pt")
    with torch.no_grad():
        scores = model(**{key: value.to(device) for key, value in encoded.items()}).logits.reshape(-1).cpu().tolist()
    result = [{**row, "score": score} for row, score in zip(rows, scores)]
    print(json.dumps(sorted(result, key=lambda row: row["score"], reverse=True), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
