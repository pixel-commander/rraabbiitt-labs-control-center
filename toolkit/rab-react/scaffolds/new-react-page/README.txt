new-react-page

TypeScript entry: new-react-page.ts
Props are one object, as declared in rab.settings.json:
- name (string) required: React page name in any text style. The scaffold normalizes it to a safe PascalCase identifier for the output folder, source/types files and saved record. Empty or punctuation-only names become Item; leading digits are prefixed with N.
- title (string): Optional display title for the generated React page; defaults to its name.
- description (string): Optional description for the generated React page.
- path (string) required: Optional pages folder. Defaults to the loaded project's configured pages path or src/pages.
- content (string): Default text; supplied children take precedence.
- save_as_text (boolean): Text output for tests.
- tags (array): Optional saved record tags.

The implementation validates before writing, uses the template/ directory relative to its module, refuses an existing destination, and returns the exact saved rab.settings.json record. Failures throw. It does not run tracking, startup, discovery, scans, or CLI parsing.


2026-10-12: ID generation uses rab-world-v2/generators/generate-world-id
(ID 1790784702601). No package-local timestamp counter. Copy this declared
dependency with the toolkit. IDs are monotonic within one loaded generator
instance; cross-process uniqueness is not guaranteed.

2026-10-27: Scaffold publishing does not generate file inventories in settings.paths. File discovery belongs to the runner finder steps.

2026-10-30: Supersedes the earlier ID-generator dependency instructions. IDs
are now generated with Date.now() in the owning implementation, with local
collision handling for batches. No separate generator package is required.
