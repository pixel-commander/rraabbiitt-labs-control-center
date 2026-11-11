new-action-atom

TypeScript entry: new-action-atom.ts
Props are one object, as declared in rab.settings.json:
- name (string) required: Atom name; action- is added once. Repeated leading prefixes are collapsed.
- title (string): Optional display title for the generated action atom; defaults to its name.
- description (string): Optional description for the generated action atom.
- path (string) required: Parent folder that will contain the new named atom folder.
- styles (string): Optional CSS skin declarations using shared project tokens. Components own layout; supply declarations without selectors or braces.
- name_prefix (string): Optional namespace prefix placed before the category, such as test-action-name.
- tags (array): Optional saved record tags.

The implementation validates before writing, uses the template/ directory relative to its module, refuses an existing destination, and returns the exact saved rab.settings.json record. Failures throw. It does not run tracking, startup, discovery, scans, or CLI parsing.


2026-10-12: ID generation uses rab-world-v2/generators/generate-world-id
(ID 1790784702601). No package-local timestamp counter. Copy this declared
dependency with the toolkit. IDs are monotonic within one loaded generator
instance; cross-process uniqueness is not guaranteed.

2026-10-12: Saved records use type for their atom category; no kind or preset
keys. Container/effect filenames substitute the atom name to match demo imports.
The grid scaffold accepts grid as its template selector, not preset.

2026-10-27: Scaffold publishing does not generate file inventories in settings.paths. File discovery belongs to the runner finder steps.

2026-10-30: Supersedes the earlier ID-generator dependency instructions. IDs
are now generated with Date.now() in the owning implementation, with local
collision handling for batches. No separate generator package is required.
