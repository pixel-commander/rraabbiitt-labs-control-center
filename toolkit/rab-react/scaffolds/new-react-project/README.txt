new-react-project

2026-10-27: The root project paths array contains the eight rendered type path category records from their rab.settings.json templates. Each entry matches its saved category record. This explicit category registry does not enumerate generated files.

2026-10-27: Eight category rab.settings.json templates describe atoms/actions, atoms/containers, atoms/effects, atoms/grids, dashboards, hooks, pages and components. They use type path, fixed category names/tags, project-relative paths and __PROJECT_NAME__ in title/description. Project generation fills that marker from input.name and preserves these path records without adding IDs, file fields or inventories.

2026-10-27: Preserve the template main.tsx imports without injecting nonexistent styles.css. App.tsx owns the template stylesheet imports.

2026-10-27: Publishing skips recursive mkdir for a drive/filesystem root parent, which already exists. This avoids Windows EPERM for projects directly under C:\. Destination creation remains exclusive.

TypeScript entry: new-react-project.ts
Props are one object, as declared in rab.settings.json:
- name (string) required: Project name.
- path (string) required: Folder that will contain the project.
- title (string): Optional project display title.
- description (string): Optional project description.
- tags (array): Optional record tags.

The implementation validates before writing, uses the template/ directory relative to its module, refuses an existing destination, and returns the exact saved rab.project.json record. Nested metadata remains in rab.settings.json files. Failures throw. It does not run tracking, startup, discovery, scans, or CLI parsing.
Project name must already be lowercase kebab-case. The old name normalizer came from the missing ../../scaffolds/new-world/new-world.mjs dependency; the migrated scaffold has no dependency on that legacy toolkit. The template carries its own package dependency versions. No database or UI kit seeding is performed.



2026-10-12: ID generation uses rab-world-v2/generators/generate-world-id
(ID 1790784702601). No package-local timestamp counter. Copy this declared
dependency with the toolkit. IDs are monotonic within one loaded generator
instance; cross-process uniqueness is not guaranteed.

2026-10-27: Scaffold publishing does not generate file inventories in settings.paths. File discovery belongs to the runner finder steps.

2026-10-30: Supersedes the earlier ID-generator dependency instructions. IDs
are now generated with Date.now() in the owning implementation, with local
collision handling for batches. No separate generator package is required.
