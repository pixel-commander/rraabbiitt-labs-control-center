# Generate search tests

Create search tests from real component, tool, runner, and skill records.
The output uses the existing test scaffold.

## Settings

| Setting | Meaning |
| --- | --- |
| `save_path` | Existing output folder outside the repository. Required. |
| `seed` | Integer used to select records. Save it for later comparison. |
| `count` | Number of tests, from 1 to 31. Default: 31. |
| `model` | Installed model used to shorten descriptions. Default: `qwen2.5-14b:latest`. |
| `url` | Local Ollama address. Default: `http://127.0.0.1:11434`. |

```json
{
  "save_path": "X:/factory-and-react-tests/tests",
  "seed": 20261113,
  "count": 31
}
```

## Test content

The first request asks for a component that performs a described task.
Thirty additional styles cover practical questions, indirect requests, and search constraints.
The final two styles cover app startup and TabNav maintenance.
Some requests require prose queries. Others require keywords or leave the wording open.

The script uses attached usage skills and explicit owner links to find nearby guidance.
It does not treat an unrelated skill as the target's instructions.
The shortening model receives the description and nearby guidance.
Its phrase must be shorter than the description and contain three to eight words.
Technical target names, long IDs, and paths cannot appear in that phrase.
Ordinary nouns, such as calendar, can remain when they describe the task.

## Output

Each test folder contains `test.json`, `README.md`, `source.json`, and `runs/`.
`source.json` preserves the target, nearby skill, seed, source hash, and shortening model digest.
The manifest and Markdown index list all generated tests.
The model under test does not receive the expected IDs or source evidence.

Matching partial batches resume without changing existing tests.
Conflicting source records or output files cause an error.
Partial output remains available if generation fails.
The same seed selects the same records from an unchanged catalog.
Model paraphrases can vary across model versions or hardware.
Use the saved test files for repeatable model comparisons.

## Checks

The target check requires the source record or linked skill in the first ten hybrid-search results.
The prose check requires at least six words in each content-search query.
The keyword check allows no more than five words.
These length checks do not assess grammar.
The final answer is not graded by the retrieval check.

Review every paraphrase for changed meaning before using the test as a benchmark.
The test may have more than one reasonable matching component.
Treat the selected target as a reference, not proof that other results are incorrect.
This generator creates tests. It does not run them.
