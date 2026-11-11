new-react-navigation

TypeScript entry: new-react-navigation.ts
Props are one object, as declared in rab.settings.json:
- name (string) required: Navigation component name in any text style. The scaffold normalizes it to a safe PascalCase identifier for the output folder, source file and saved record. Empty or punctuation-only names become Item; leading digits are prefixed with N.
- title (string): Optional display title for the generated React navigation component; defaults to its name.
- description (string): Optional description for the generated React navigation component.
- path (string) required: 
- rows (array) required: Required nonempty array of unique {id, name, path} records.
- label (string): 
- grid (string): Optional canonical grid layout; adds data-grid.
- class_name (string): Optional class string appended to the base class.
- save_as_text (boolean): Write component source with a .txt extension.
- tags (array): Optional saved record tags.

The implementation validates before writing, uses the template/ directory relative to its module, refuses an existing destination, and returns the exact saved rab.settings.json record. Failures throw. It does not run tracking, startup, discovery, scans, or CLI parsing.
Optional grid values are checked against the bundled template/grid.css catalog, resolved relative to the scaffold. class_name is emitted as a class string; no class-atom resolver is available.



2026-10-12: ID generation uses rab-world-v2/generators/generate-world-id
(ID 1790784702601). No package-local timestamp counter. Copy this declared
dependency with the toolkit. IDs are monotonic within one loaded generator
instance; cross-process uniqueness is not guaranteed.

2026-10-12: Navigation supplies its substitutions to template() in one pass.
It no longer renders with an empty map before passing values. Static correction;
scaffold execution and generated-output tests remain pending.

2026-10-12: Grid validation reads this scaffold's template/grid.css. No host
src/css/grid.css read is required. Component/navigation consumers still supply
their runtime House grid styles; dashboard includes its own output copy.

2026-10-27: Scaffold publishing does not generate file inventories in settings.paths. File discovery belongs to the runner finder steps.

2026-10-30: Supersedes the earlier ID-generator dependency instructions. IDs
are now generated with Date.now() in the owning implementation, with local
collision handling for batches. No separate generator package is required.
