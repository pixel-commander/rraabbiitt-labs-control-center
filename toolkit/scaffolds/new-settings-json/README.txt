New settings JSON

Run: node new-settings-json.mjs
Or: node new-settings-json.mjs input.json
Or: node new-settings-json.mjs --json "<JSON input>"
Module: await newSettingsJson(input)
Pure metadata: await createSettings(input)

Required: path (destination folder), name, title, description, type.
Optional: tags (string array), paths (array), defaulting to [].
Inputs must be supplied; missing required fields fail validation.

Reads template/rab.settings.json and populates id, name, title, description,
type, tags, paths. IDs come from the shared generateWorldId timestamp generator.
Writes <path>/rab.settings.json and creates the destination folder if needed.
The absolute destination path and file rab.settings.json are stored. Name is stored as supplied
with surrounding whitespace removed; no named child folder is created.
Existing rab.settings.json is refused, never overwritten.
No world registration, scan, watcher or database import runs.

2026-10-16: repaired the stale timestamp import to use generate-world-id.
Verified monotonic IDs, saved path/file and refusal to overwrite existing settings.
