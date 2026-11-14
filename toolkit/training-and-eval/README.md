# Training and evaluation

Create fixed tests. Compare model attempts against the same checks.

## Locations

Keep tools, runners, templates, and shared types in this toolkit.
Keep test definitions and model results outside the code repository.

```text
toolkit/training-and-eval/
  generate-react-tests/
  scaffolds/new-react-test/template/
  runners/run-react-tests/
  schema-versions.ts
  schema-versions.types.ts

X:/factory-and-react-tests/tests/
  test-name/
    test.json
    README.md
    runs/
```

## Create a test

1. Select an existing output folder.
2. Supply that folder in `save_path`.
3. Supply a unique test name.
4. Call `generate-react-tests`.

```json
{"name":"find-action-atoms","save_path":"X:/factory-and-react-tests/tests"}
```

The generator prepares the test data.
The scaffold creates the test folder from `template/`.
An existing destination causes an error.
A file error can leave a partial folder. The error includes its location.

## Run tests

1. Select test folders outside this repository.
2. Supply their path to `run-react-tests`.
3. Select installed Ollama model names.
4. Read the results in each test's `runs/` folder.

The runner uses fresh model conversations.
Every model tool call goes through MCP.
The evidence file contains the conversation and tool returns.
The runner does not use the chat application's saved conversations.

## Shared format

`schema-versions.ts` validates documents at runtime.
`schema-versions.types.ts` provides shared House-based types.
`evaluation-test` defines a test.
`evaluation-run` records one attempt.
`schema_version` identifies the document shape.
`version` identifies a revision of one test.

Keep a used test unchanged.
Create a new folder for a revised test.
`test_sha256` identifies the exact bytes in `test.json`.
Unknown token counts are `null`.
A complete attempt can have a failed test outcome.

## Current limits

The layout check measures structure. It does not measure visual quality.
House-grid discovery still needs an accessible tool or skill.
Keep assisted trials separate from unassisted trials.
Use at least five attempts per model for a comparison.

## Verify the implementation

```text
node toolkit/training-and-eval/generate-react-tests/generate-react-tests.test.mjs
node toolkit/training-and-eval/runners/run-react-tests/run-react-tests.test.mjs
```

These scripts check the implementation. Their temporary output stays outside the repository.

Writing reference: [ASD-STE100](https://www.asd-ste100.org/STE_faq.html).
