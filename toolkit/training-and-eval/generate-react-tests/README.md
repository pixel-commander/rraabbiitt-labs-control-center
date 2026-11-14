# Generate React tests

Create one test folder through the `new-react-test` scaffold.
This tool does not run a model.

## Required settings

| Setting | Meaning |
| --- | --- |
| `name` | A unique folder name. Use lowercase words with hyphens. |
| `save_path` | An existing parent folder outside the code repository. |

```json
{
  "name": "find-action-atoms",
  "save_path": "X:/factory-and-react-tests/tests"
}
```

## Optional settings

Use `prompt`, `setup`, `limits`, and `checks` to replace template values.
Supply each complete object or array when you replace it.
Use `id`, `title`, `description`, and `tags` for House metadata.
Use `version` for a test revision.
Only `schema_version: 1` is available.

## Return

The return uses House `ToolReturn`.
`status` is `complete` or `error`.
`settings` contains the supplied settings.
`response.path` gives the output folder.
`response.file` is `test.json`.
`response.code` contains the saved JSON.
`response.test_sha256` gives the file hash.
`response.paths` lists the output locations.

An existing output folder causes an error.
The stamped wrapper records tool usage once.
