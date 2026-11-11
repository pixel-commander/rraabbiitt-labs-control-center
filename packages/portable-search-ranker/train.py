"""Train a clean, local cross-encoder candidate from reviewed JSONL examples."""
import argparse
import hashlib
import json
import math
import random
import os
from pathlib import Path

os.environ.setdefault("HF_HOME", str(Path(__file__).resolve().parent / "models" / "hf-cache"))

import torch
from torch.utils.data import DataLoader, Dataset
from transformers import AutoModelForSequenceClassification, AutoTokenizer

BASE_MODEL = "cross-encoder/ms-marco-MiniLM-L6-v2"
BASE_REVISION = "233902d25c440f23af6f7d6e94d2946bac0bee0a"


def read_examples(path):
    rows = []
    for number, line in enumerate(Path(path).read_text(encoding="utf-8-sig").splitlines(), 1):
        if not line.strip():
            continue
        row = json.loads(line)
        query, document, grade = row.get("query"), row.get("document"), row.get("grade")
        if not isinstance(query, str) or not query.strip() or not isinstance(document, str) or not document.strip():
            raise ValueError(f"Line {number}: query and document must be non-empty strings.")
        if isinstance(grade, bool) or not isinstance(grade, (int, float)) or not math.isfinite(grade) or not 0 <= grade <= 1:
            raise ValueError(f"Line {number}: grade must be a number from 0 to 1.")
        rows.append({"query": query, "document": document, "grade": float(grade)})
    if len(rows) < 4:
        raise ValueError("Add at least four reviewed pairs before training.")
    groups = sorted({row["query"].strip().casefold() for row in rows})
    if len(groups) < 2:
        raise ValueError("Use at least two distinct queries so the validation split can hold out whole query groups.")
    if not any(row["grade"] == 0 for row in rows) or not any(row["grade"] == 1 for row in rows):
        raise ValueError("Include both clearly wrong (0) and correct (1) reviewed pairs.")
    return rows


def split_by_query(rows, seed):
    groups = sorted({row["query"].strip().casefold() for row in rows})
    random.Random(seed).shuffle(groups)
    held_count = max(1, min(len(groups) - 1, round(len(groups) * 0.2)))
    held = set(groups[:held_count])
    train = [row for row in rows if row["query"].strip().casefold() not in held]
    valid = [row for row in rows if row["query"].strip().casefold() in held]
    if not train or not valid:
        raise ValueError("Could not create a non-empty query-group validation split.")
    return train, valid


class PairDataset(Dataset):
    def __init__(self, rows):
        self.rows = rows

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, index):
        return self.rows[index]


def collate(tokenizer, rows):
    encoded = tokenizer(
        [row["query"] for row in rows], [row["document"] for row in rows],
        padding=True, truncation=True, max_length=512, return_tensors="pt",
    )
    return encoded, torch.tensor([row["grade"] for row in rows], dtype=torch.float32)


def evaluate(model, tokenizer, rows, device):
    model.eval()
    losses = []
    with torch.no_grad():
        for start in range(0, len(rows), 16):
            encoded, grades = collate(tokenizer, rows[start:start + 16])
            logits = model(**{key: value.to(device) for key, value in encoded.items()}).logits.reshape(-1)
            losses.append(torch.nn.functional.binary_cross_entropy_with_logits(logits, grades.to(device)).item())
    return sum(losses) / len(losses)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", default="data/train.jsonl")
    parser.add_argument("--output", default="models/candidate")
    parser.add_argument("--epochs", type=int, default=2)
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--learning-rate", type=float, default=2e-5)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--device", choices=("auto", "cpu", "cuda"), default="auto")
    args = parser.parse_args()
    if not 1 <= args.epochs <= 10 or not 1 <= args.batch_size <= 32 or not 0 < args.learning_rate <= 0.001:
        parser.error("epochs must be 1–10, batch-size 1–32, and learning-rate >0–0.001")
    rows = read_examples(args.data)
    train_rows, valid_rows = split_by_query(rows, args.seed)
    device = "cuda" if args.device == "auto" and torch.cuda.is_available() else ("cpu" if args.device == "auto" else args.device)
    if device == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("CUDA was requested but this Python environment cannot see a CUDA GPU. Install the matching PyTorch build or use --device cpu.")
    random.seed(args.seed)
    torch.manual_seed(args.seed)
    if device == "cuda":
        torch.cuda.manual_seed_all(args.seed)
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, revision=BASE_REVISION)
    model = AutoModelForSequenceClassification.from_pretrained(BASE_MODEL, revision=BASE_REVISION, num_labels=1, ignore_mismatched_sizes=True).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate)
    loader = DataLoader(PairDataset(train_rows), batch_size=args.batch_size, shuffle=True, collate_fn=lambda batch: collate(tokenizer, batch))
    before = evaluate(model, tokenizer, valid_rows, device)
    steps = 0
    for epoch in range(args.epochs):
        model.train()
        for encoded, grades in loader:
            encoded = {key: value.to(device) for key, value in encoded.items()}
            grades = grades.to(device)
            optimizer.zero_grad(set_to_none=True)
            logits = model(**encoded).logits.reshape(-1)
            loss = torch.nn.functional.binary_cross_entropy_with_logits(logits, grades)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            steps += 1
        print(f"epoch {epoch + 1}/{args.epochs}: validation BCE {evaluate(model, tokenizer, valid_rows, device):.4f}")
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(output)
    tokenizer.save_pretrained(output)
    report = {
        "base_model": BASE_MODEL, "base_revision": BASE_REVISION,
        "dataset_sha256": hashlib.sha256(Path(args.data).read_bytes()).hexdigest(),
        "examples": len(rows), "train_examples": len(train_rows), "validation_examples": len(valid_rows),
        "validation_query_groups": sorted({row["query"].strip().casefold() for row in valid_rows}),
        "initial_validation_bce": before, "final_validation_bce": evaluate(model, tokenizer, valid_rows, device),
        "optimizer_steps": steps, "seed": args.seed, "device": device,
        "candidate_only": True,
        "note": "Fresh candidate initialized from the pinned pretrained reranker; it does not update or replace any other model.",
    }
    (output / "training-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
