Refresh world database

Standalone database indexer. Read root rab.project.json and scan its registered folders for records, READMEs and skills. Include the exact toolkit folders registered in this world's rab.world.json, within HQ. Local copies take precedence over shared copies with the same House ID. Optional path selects a project root or its configured database. Preserve the incoming settings bag. Upsert transactionally, preserve source IDs, and refresh word/pair indexes. Require numeric, unique source House IDs; never invent source IDs. Remove stale source-managed rows when files or registrations disappear, preserving application rows. Return counts in response.body and response.summary. No model imports, vector generation or checkpoint changes. Requires Python with PyYAML.

CLI: pipe a JSON settings bag to python -B refresh_world_database.py.

WORLD SCOPE (2026-11-09)
Pass HQ world root or its registered toolkit root. A containing rab.world.json
selects all registered projects, not only toolkit folders. Every source
rab.settings.json is indexed, including folder records and scaffold definitions.
Missing/duplicate IDs fail before writes. Templates, dependencies, generated model
checkpoints, build output, temp folders and symlinks are excluded.
Original toolkit keys remain unchanged; other keys use world-relative project prefix.
Skill owners resolve by numeric ID; no path is required in skills. Missing owner
IDs produce warnings; standalone skills remain searchable without false owner links.
The wrapper resolves search-python from world registration unless the explicit
TOOL_LEARNER_PYTHON override is set. Standalone projects retain the python fallback.
Test: registered Python -B test_refresh_world_database.py from this folder.

Registered rab.beacon.json files are followed through their exact paths.
Nested beacons are supported. A visited set prevents cycles. Files and folders
that escape the current project are rejected. No unregistered sibling folder
is scanned merely because it contains a skill. A beacon registers discovery;
it does not create missing instructions or replace a skill's ID.

