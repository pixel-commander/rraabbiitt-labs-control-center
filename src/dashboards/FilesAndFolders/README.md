# Files and Folders

Open `/files-and-folders` in the app. Choose a root and select **Scan files and folders**. The scanner first discovers folders, then three asynchronous workers inspect their direct files. It saves only complete inventories to the project `discovery` table.

## Explore

Expand a folder or select its name. Each row has a file-type chart. The selected folder shows descendant totals, an extruded file-type pie, its share of indexed files, a layered canvas city, a glass WebGL digital city, an expandable force-directed 3D folder network, bar charts, and import graphs. Each view remains available in its own tab. City columns use actual file counts. Select a folder from the city key to repeat the same view for its children. WebGL nodes represent files, and edges represent resolved module references. The connection table remains available when WebGL is unavailable. Partial import results show their errors. Orphan candidates are suppressed if the static graph is incomplete.

## Find and audit

Use the finder console below the explorer. `db: true` selects saved discovery rows; false crawls the current filesystem. Content and import checks still read the selected source files. Favorites save settings to `finder_presets`; loading a favorite does not execute it. The audit button uses the registered audit runner.

## Locations

- `toolkits/tools/`: refresh, finds, counters, orphan listing and preset storage.
- `toolkits/runners/`: refresh and audit plans using the existing shared execution owner.
- `toolkits/_shared/`: database/query/parser helpers and thin HTTP transport.
- `components/`: project-specific folder rows, finder console and canvas/WebGL views.
- `src/components/ScannerStatusUi/`: reusable scanner window, progress hook, scan transport, theme styles and ignored-folder configuration.

All tool calls from this page use the same tracked runner as MCP. They appear in tool activity and persisted run history. The tool catalog and filesystem discovery are separate.

`toolkits/README.md` documents settings and return contracts. `LEGACY-AUDIT-INVENTORY.md` and `audit-inventory.json` retain the old source inventory. `source-files.json` keeps the original file manifest and hashes.

## Checks

Run `npm run build` and the test files under `toolkits/_shared/`, `toolkits/tools/refresh-discovery-index/` and `components/DiscoveryExplorer/js/`. Tests use temporary fixtures. No source repair or deletion occurs.
