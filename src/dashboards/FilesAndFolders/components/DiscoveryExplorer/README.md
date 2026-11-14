# Discovery Explorer

Use `DiscoveryExplorer` inside the Files and Folders dashboard.

```tsx
<DiscoveryExplorer root={absoluteRoot} refresh_key={successfulScanCount} />
```

`root` is the absolute scan root. Increment `refresh_key` after a successful discovery refresh. The explorer reads the saved discovery table. Opening folders does not scan the disk.

The explorer contains a recursive folder list, folder breadcrumbs, direct files, descendant totals, and charts. Each closed or open folder row has a small file-type donut. Selecting a folder applies the same views to that folder's descendants.

The three chart views are:

- **3D file types:** extruded canvas donut and a gauge for this folder's share of indexed root files.
- **3D folder city:** projected columns for immediate subfolders and direct files. Column height is the descendant file count. Select a folder in the numbered key to enter its next layer.
- **WebGL imports:** native WebGL file nodes and resolved module-reference edges. Select **Map imports** to run `count-imports` through the tracked toolkit endpoint. Drag or use arrow keys to orbit. Scroll or use plus/minus to zoom. Home resets the camera. Hover a node to inspect it. Click a node or select a row in the graph-data table to pin it. Escape clears the pin.

The WebGL view represents source-module relationships. It does not claim to show a trained neural network. It shows up to 120 connected files ranked by reference degree, with actual visible and total counts. HTML/CSS and nonliteral dependencies can leave an incomplete source graph; source review counts and an expandable list of file-level errors remain visible while resolved graph connections and the folder inventory stay usable.

All chart geometry is derived from saved rows or returned module references. No sample rows or invented network links are injected. The data tables provide text equivalents for canvas graphics. A missing WebGL context is reported with a table fallback.

Colors come from the project's theme tokens. Canvas redraws on data, resize, DPR/viewport and theme changes. It does not run an idle animation loop. GPU buffers, shaders, observers, and event listeners are released when their view unmounts.

Discovery is read in pages of up to 100,000 rows. Above 500,000 loaded rows the UI gives an explicit partial-visualization notice. Use a narrower scan root for complete charts at that scale.

## API

- `GET /api/files-and-folders/discovery?root=...&limit=100000&offset=...` returns House `ToolReturn`; rows are in `response.paths` and pagination/state are in JSON `response.body`.
- `POST /api/files-and-folders/tools` with `{name:'count-imports',settings:{root,db:true,limit:10000}}` returns the tracked step array. `count-imports.response.body.references` supplies network edges.

## Check

Run `node --test src/dashboards/FilesAndFolders/components/DiscoveryExplorer/js/discovery-model.test.mjs` from the repository root. The checks cover folder rollups, implicit ancestor folders, duplicate file rows, case rules and path boundaries.
