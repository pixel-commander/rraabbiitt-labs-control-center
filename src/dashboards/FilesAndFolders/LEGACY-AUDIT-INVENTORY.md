# Files and Folders

Open `/files-and-folders` in the app. The dashboard shows this source-reviewed audit inventory. Tools have not been installed or run.

## Reuse order

1. Adapt the ten standalone World Toolkit checkers with their adjacent shared helpers and current usage recording.
2. Add file-type/size and SVG inventories from Audit Factory. Keep import inventories and hook counts as separate capabilities.
3. Port the seven Box security test groups against this project’s actual API and path rules. Its eighth entry runs the whole suite.

Use the current House settings and return contracts. Return findings and counts with a separate report verdict. Keep report saving explicit. Source files must stay unchanged during audits.

## Inventory

| Source | Folder | Capability | Assessment | Work needed |
| --- | --- | --- | --- | --- |
| Audit Factory | components | components-check | Adapt | Uses legacy settings.js, hidden flags and a fixed component root; switch to rab.settings.json and explicit path. |
| Audit Factory | file-system-audit/comments | check-for-comments | Adapt | Useful comment inventory; regex findings need review, not automatic deletion. |
| Audit Factory | file-system-audit/exports | count-imports | Consolidate | Metadata and implementation both scan imports, despite the exports folder name. Consolidate with imports; do not register as an export checker. |
| Audit Factory | file-system-audit/filetypes | count-file-types | Reuse with wrapper | File counts and byte totals by extension. Add current House settings, return shape and recorder. |
| Audit Factory | file-system-audit/imports | count-imports | Adapt | Useful import and reverse-reference inventory; regex analysis needs TypeScript parsing for reliable source relationships. |
| Audit Factory | guard | guard-check | Prefer newer checker | Use World Toolkit check-data-guards instead of the old blanket guard rules. |
| Audit Factory | neuron-ids | neuron-ids | Legacy only | Reads ID fields in SKILL.txt and RULES.txt; current JSON/YAML registrations need different parsing. |
| Audit Factory | root-path-names | root-path-names | Legacy only | Checks ROOT_PATH.txt naming; current worlds use JSON paths. |
| Audit Factory | rraabb | count-rraabb-txt | Legacy only | Counts RRAABB.txt markers; keep only for old-world migration. |
| Audit Factory | state_hooks | count-state-hooks | Adapt | Hook counts are useful metrics; newer check-state-hooks checks a different state-ownership rule. |
| Audit Factory | svg_names | get-names | Reuse with wrapper | Useful SVG filename inventory; add current tool contract and recorder. |
| Audit Factory | svg_strokes | get-stroke-styles | Reuse with wrapper | Useful SVG stroke inventory; add current tool contract and recorder. |
| Audit Factory | svg_viewboxes | get-viewboxes | Reuse with wrapper | Useful SVG viewBox inventory; add current tool contract and recorder. |
| Audit Factory | use_effects | count-use-effects | Adapt | Useful hook metrics; retain as counts, not a blanket code-quality failure. |
| Audit Factory | world-paths-checker | world-paths-checker | Rewrite for current world | Actual implementation classifies PATHS.txt formats in immediate child worlds. It does not verify every declared path despite its description. |
| Audit Factory | writers/icons | icons-index | Writer; exclude from audit | Generates icon files and deletes source SVGs by default. Keep separate from read-only auditing. |
| World Toolkit | checkers/check-component-files | check-component-files | Reuse with adapter | Standalone checker with shared helpers. Adapt shared type imports and recorder. Execution completion differs from report verdict. |
| World Toolkit | checkers/check-css-states | check-css-states | Reuse with adapter | Standalone checker with shared helpers. Adapt shared type imports and recorder. Execution completion differs from report verdict. |
| World Toolkit | checkers/check-css-tokens | check-css-tokens | Reuse with adapter | Standalone checker with shared helpers. Adapt shared type imports and recorder. Execution completion differs from report verdict. |
| World Toolkit | checkers/check-data-guards | check-data-guards | Reuse with adapter | Standalone checker with shared helpers. Adapt shared type imports and recorder. Execution completion differs from report verdict. |
| World Toolkit | checkers/check-dependencies | check-dependencies | Reuse with adapter | Standalone checker with shared helpers. Adapt shared type imports and recorder. Execution completion differs from report verdict. |
| World Toolkit | checkers/check-form-fields | check-form-fields | Reuse with adapter | Standalone checker with shared helpers. Adapt shared type imports and recorder. Execution completion differs from report verdict. |
| World Toolkit | checkers/check-grid | check-grid | Reuse with adapter | Standalone checker with shared helpers. Adapt shared type imports and recorder. Execution completion differs from report verdict. Checks numeric track counts only, not full layout correctness. |
| World Toolkit | checkers/check-prop-names | check-prop-names | Reuse with adapter | Standalone checker with shared helpers. Adapt shared type imports and recorder. Execution completion differs from report verdict. |
| World Toolkit | checkers/check-state-hooks | check-state-hooks | Reuse with adapter | Standalone checker with shared helpers. Adapt shared type imports and recorder. Execution completion differs from report verdict. |
| World Toolkit | checkers/check-tool-keys | check-tool-keys | Reuse with adapter | Standalone checker with shared helpers. Adapt shared type imports and recorder. Execution completion differs from report verdict. |
| World Toolkit | runners/runner-code-review | runner-code-review | Adapt orchestrator | Useful selection and report workflow, but imports the old tracking runner. Compose imported checkers through our current runner instead. |
| World Toolkit | runners/runner-find-all-type | world records by type | Compare existing | Infrastructure capability overlaps our toolkit. Compare contracts and behavior before copying; not a new audit by itself. |
| World Toolkit | runners/runner-project-records | runner-project-records | Compare existing | Infrastructure capability overlaps our toolkit. Compare contracts and behavior before copying; not a new audit by itself. |
| World Toolkit | runners/runner-tooling-and-tracking | runner-tooling-and-tracking | Compare existing | Infrastructure capability overlaps our toolkit. Compare contracts and behavior before copying; not a new audit by itself. |
| World Toolkit | runners/runner-use-tool | runner-use-tool | Compare existing | Infrastructure capability overlaps our toolkit. Compare contracts and behavior before copying; not a new audit by itself. |
| World Toolkit | tools/find-all-type | find-all-type | Compare existing | Infrastructure capability overlaps our toolkit. Compare contracts and behavior before copying; not a new audit by itself. |
| World Toolkit | tools/generate-world-database | generate-world-database | Compare existing | Infrastructure capability overlaps our toolkit. Compare contracts and behavior before copying; not a new audit by itself. |
| World Toolkit | tools/mcp-server | world-demo-mcp-server | Compare existing | Infrastructure capability overlaps our toolkit. Compare contracts and behavior before copying; not a new audit by itself. |
| World Toolkit | tools/new-db-table | new-db-table | Compare existing | Infrastructure capability overlaps our toolkit. Compare contracts and behavior before copying; not a new audit by itself. |
| World Toolkit | tools/new-sqlite-db | new-sqlite-db | Compare existing | Infrastructure capability overlaps our toolkit. Compare contracts and behavior before copying; not a new audit by itself. |
| World Toolkit | tools/refresh-project-index | refresh-project-index | Compare existing | Infrastructure capability overlaps our toolkit. Compare contracts and behavior before copying; not a new audit by itself. |
| World Toolkit | tools/scan-path-records | scan-path-records | Compare existing | Infrastructure capability overlaps our toolkit. Compare contracts and behavior before copying; not a new audit by itself. |
| World Toolkit | tools/search-records | search-records | Compare existing | Infrastructure capability overlaps our toolkit. Compare contracts and behavior before copying; not a new audit by itself. |
| World Toolkit | tools/tool-loader | tool-loader | Compare existing | Infrastructure capability overlaps our toolkit. Compare contracts and behavior before copying; not a new audit by itself. |
| Box Security | check/control-plane-language | control-plane-language | Adapt security test | Depends on the old Box server, bridge, Tool House and fixtures. Port the test intent to this project; not a standalone filesystem scanner.  |
| Box Security | check/control-plane-move | control-plane-move | Adapt security test | Depends on the old Box server, bridge, Tool House and fixtures. Port the test intent to this project; not a standalone filesystem scanner.  |
| Box Security | check/dom-write-boundaries | dom-write-boundaries | Adapt security test | Depends on the old Box server, bridge, Tool House and fixtures. Port the test intent to this project; not a standalone filesystem scanner.  |
| Box Security | check/http-boundaries | http-boundaries | Adapt security test | Depends on the old Box server, bridge, Tool House and fixtures. Port the test intent to this project; not a standalone filesystem scanner.  |
| Box Security | check/local-network | local-network | Adapt security test | Depends on the old Box server, bridge, Tool House and fixtures. Port the test intent to this project; not a standalone filesystem scanner. Current MCP intentionally binds 0.0.0.0; review that requirement before adopting loopback-only assertions. |
| Box Security | check/paths-registry | paths-registry | Adapt security test | Depends on the old Box server, bridge, Tool House and fixtures. Port the test intent to this project; not a standalone filesystem scanner.  |
| Box Security | check/project-override | project-override | Adapt security test | Depends on the old Box server, bridge, Tool House and fixtures. Port the test intent to this project; not a standalone filesystem scanner.  |
| Box Security | check/workbench | workbench | Suite; adapt | Depends on the old Box server, bridge, Tool House and fixtures. Port the test intent to this project; not a standalone filesystem scanner.  |

## Source records

`source-files.json` includes each source file’s relative path, byte count and SHA-256 hash. `audit-inventory.json` lists each capability with its source location, imports and reuse assessment. This is a snapshot, not a live scan.

Important differences: the exports folder contains another import scanner; world-paths-checker classifies old PATHS.txt files rather than checking their declared targets; writers/icons deletes input SVGs unless configured otherwise. The empty world-paths folder contains no tool.

The dashboard was created with registered scaffold tool 1830000000006. The dashboard runner failed to resolve the project destination, so the scaffold was given the explicit src/dashboards parent. The existing add-view-to-nav tool is a stub; navigation was connected directly.
