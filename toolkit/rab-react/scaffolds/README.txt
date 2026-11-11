React scaffold packages

Each package owns <tool>.ts, <tool>.types.ts, rab.settings.json, README.txt, template/, and package-local scaffold.ts support. The implementation accepts one props object extending HouseKeys and returns the exact generated rab.settings.json record.

Fresh output packages are created exclusively at the requested destination and never replace an existing folder. Failures throw. The shared runner owns tracking; scaffolds do not launch it. No startup, discovery, world scan, or automatic registration runs after creation. Read each leaf README for props, output files, shared grid catalog dependency, and limitations.


2026-10-12: Replaced scaffold-local ID counters with generate-world-id.
Project creation regenerates IDs for every nested settings record, including
home and style-guide. Subcomponent rendering now uses one substitution map.
These changes have been statically inspected; generated output is not tested.

2026-10-12: Atom records use type actions/containers/effects/grids, with no
kind or preset keys. Effects use the same CSS + demo structure as containers.
Grid-using scaffolds own template/grid.css; do not reach into host src/css.
new-grid-atom uses the grid input to select its local template.

2026-10-12: Local TypeScript imports include .ts for direct Node execution.
Destination validation requires absolute paths. Publishing preserves partial
output on failure; there is no recursive cleanup. Test output belongs outside
the repo. runner-test-scaffolds exposes all eleven examples in the tracker.

2026-10-30: Supersedes the earlier ID-generator dependency instructions. IDs
are now generated with Date.now() in the owning implementation, with local
collision handling for batches. No separate generator package is required.
