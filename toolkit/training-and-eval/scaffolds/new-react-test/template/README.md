# Model test

`test.json` defines this test.
`runs/` contains model results and their evidence files.

## Run this test

1. Select the installed models.
2. Supply this folder to `run-react-tests`.
3. Use the same options for each model.
4. Read the result and evidence files in `runs/`.

## Keep comparisons valid

Keep this test unchanged after its first run.
Create a new version in a new folder for changes.
Compare attempts that use the same test hash and environment.
Keep assisted attempts separate.
Check MCP receipts before accepting a success claim.

The first template includes a house-grid check.
Grid discovery must be available before that check gives a fair model comparison.
A generated folder does not contain a model result until a run finishes.
