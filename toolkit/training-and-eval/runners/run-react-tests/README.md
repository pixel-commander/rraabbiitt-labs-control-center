# Run React tests

Run fixed tests against local Ollama models. Each attempt starts with an empty conversation.
This runner uses its own model conversation. It does not use the chat application's saved history or prompts.

## Settings

| Setting | Required | Meaning |
| --- | --- | --- |
| `path` | Yes | An external test folder, or a parent folder that contains tests. |
| `models` | Yes | Installed Ollama model names. |
| `repetitions` | No | Attempts per model and test. Default: 1. Maximum: 20. |
| `url` | No | Local Ollama address. Default: `http://127.0.0.1:11434`. |
| `options` | No | Ollama options for every attempt. |

```json
{
  "path": "X:/factory-and-react-tests/tests/find-action-atoms-v2",
  "models": ["rraabbiitt-v1:latest", "qwen2.5-14b:latest"],
  "repetitions": 1
}
```

## Procedure

1. Generate test folders outside the code repository.
2. Select installed model names.
3. Run this runner with the same options for each model.
4. Read each result in the test's `runs/` folder.
5. Read its evidence file to examine the conversation and tool returns.

Default options are temperature 0, seed 42, context size 8192, and output limit 2048.
The result records the requested options and installed model digest.
The environment record contains hashes for source files and the search catalog.
The same options do not guarantee identical output from different models or hardware.

## Output

```text
test-name/
  test.json
  runs/
    123.json
    123.evidence.json
```

The result uses the shared `evaluation-run` schema.
The runner returns the House `RunnerReturn` array.
Each response uses House identity, path, file, and summary fields.
The custom `result` field contains the evaluation result.
The `thread_id` identifies the isolated conversation in its evidence file.
It is not a chat application thread ID.

## Evidence and checks

Every model tool call uses the existing MCP gateway.
The runner requires a persisted MCP run receipt before it accepts tool evidence.
Execution requires a tool ID from the test's allowed list.
The model must inspect a tool before execution.
The runner records denied calls as errors.
The runner enforces the test's call limit before each tool call.
It stops new requests when the time limit expires.
A request timeout does not cancel work already started by another server.

The `atom-list` check compares the requested category with the actual atom records.
The layout check reads the saved composition from the Factory API.
It checks structure and registered names. It does not assess visual quality.
The URL check compares the answer with the verified record ID.
Missing token counts are `null`.

A completed attempt can have a failed test outcome.
An infrastructure error produces a blocked outcome.
Use five or more attempts per model before comparing success rates.
Keep assisted trials separate from these unassisted trials.

## Limits

Only local Ollama models are supported in this first runner.
Grid discovery still needs an accessible tool or skill.
A model can fail the house-grid check because that capability is absent.
Do not interpret that failure as an isolated model reasoning failure.
The output lock prevents two runners from using the same selected test root.
Use a single runner for the full test collection.
