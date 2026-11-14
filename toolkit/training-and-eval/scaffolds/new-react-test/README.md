# New React test

Create the standard folder structure for one test.

## Required settings

| Setting | Meaning |
| --- | --- |
| `name` | The test folder name. |
| `save_path` | An existing parent folder. |
| `test` | A valid `evaluation-test` document with `schema_version: 1`. |

Use the same name in `name` and `test.name`.

## Template

```text
template/
  test.json
  README.md
  runs/.gitkeep
```

The generator reads defaults from `template/test.json`.
The scaffold writes the supplied test into the new folder.
It copies the README and creates `runs/`.
An existing destination causes an error.

## Return

The return uses the House scaffold format.
It includes identity, output locations, saved JSON, and `test_sha256`.
The scaffold does not run a model.
