"""Persistent JSONL adapter for the shared hybrid-ranking retrieval dispatcher."""
from __future__ import annotations

import contextlib
import json
import sys
from pathlib import Path

sys.stdin.reconfigure(encoding="utf-8")
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8", errors="backslashreplace")

MODEL_ROOT = Path(__file__).resolve().parents[3] / "models" / "hybrid-seat-ranking"
sys.path.insert(0, str(MODEL_ROOT))

with contextlib.redirect_stdout(sys.stderr):
    from retrieval import dispatch  # noqa: E402


def main() -> None:
    for line in sys.stdin:
        request_id = None
        settings = {}
        try:
            request = json.loads(line)
            request_id = request.get("id")
            operation = request.get("operation")
            settings = request.get("settings", {})
            if not isinstance(settings, dict):
                raise ValueError("Settings must be an object")
            # Libraries and dependencies may print diagnostics; stdout is reserved
            # for one JSON response per request.
            with contextlib.redirect_stdout(sys.stderr):
                result = dispatch(operation, settings)
            if not isinstance(result, dict) or result.get("status") not in ("complete", "error"):
                raise ValueError("Retrieval dispatcher returned an invalid ToolReturn")
        except Exception as error:  # Keep the worker alive for later requests.
            result = {"status": "error", "settings": settings, "error": str(error)}
        sys.stdout.write(json.dumps({"id": request_id, "result": result}, ensure_ascii=False) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
