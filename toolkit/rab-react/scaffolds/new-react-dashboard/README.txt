new-react-dashboard

TypeScript entry: new-react-dashboard.ts
Props are one object, as declared in rab.settings.json:
- name (string) required: Dashboard page name in any text style. The scaffold normalizes it to a safe PascalCase identifier for the output folder, source/types files and saved record. Empty or punctuation-only names become Item; leading digits are prefixed with N.
- path (string) required: Destination parent folder.
- layout (string): Supported dashboard grid topology.
- title (string): Optional page heading.
- description (string): Optional page description.
- content (string): Optional initial main content.
- tags (array): Optional saved record tags.

The implementation validates before writing, uses the template/ directory relative to its module, refuses an existing destination, and returns the exact saved rab.settings.json record. Failures throw. It does not run tracking, startup, discovery, scans, or CLI parsing.
The output is grouped under path/name. It supports header-main only and leaves the header empty. The host application supplies runtime House grid styles; the bundled template/grid.css is used only for scaffold validation and is not copied or imported by generated dashboards.



2026-10-12: ID generation uses rab-world-v2/generators/generate-world-id
(ID 1790784702601). No package-local timestamp counter. Copy this declared
dependency with the toolkit. IDs are monotonic within one loaded generator
instance; cross-process uniqueness is not guaranteed.

2026-10-12: Grid validation reads this scaffold's template/grid.css. No host
src/css/grid.css read is required. Component/navigation consumers still supply
their runtime House grid styles; dashboard includes its own output copy.

2026-10-27: Scaffold publishing does not generate file inventories in settings.paths. File discovery belongs to the runner finder steps.

2026-10-29: Dashboard output now relies on the host grid stylesheet rather than
including a local copy. Navigation output lives under components/.

2026-10-30: Supersedes the earlier ID-generator dependency instructions. IDs
are now generated with Date.now() in the owning implementation, with local
collision handling for batches. No separate generator package is required.
