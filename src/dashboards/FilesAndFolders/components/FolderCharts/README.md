# Folder charts

Charts use saved discovery rows and resolved module references. They do not invent connections or estimate disk usage. Canvas colors come from the active theme.

## Views

- **3D force graph:** the selected 3d-force-graph / Three.js WebGL engine renders the actual folder hierarchy. Expand or collapse nodes, fly to a folder, orbit, inspect paths, and fit the full graph.
- **Canvas clusters:** the earlier projected-canvas constellation remains available.
- **Digital city:** true WebGL glass volumes, folder terraces, illuminated hierarchy links, bloom, orbit controls and exact-count drill-down. Layout comes from repository hierarchy, not geographic street maps.

- **3D file types:** translucent glass type-composition pie, thin proportional extension bars and the selected folder’s real share of indexed files.
- **Bar charts:** stacked folder and extension comparisons; file counts or percentages; sorting, filtering, visible-group controls, optional extrusion and exact data. Select folder bars to drill down.
- **Layered city:** nested districts represent the folder hierarchy. Platform height represents folder depth. Building heights and district areas use square-root file counts so small groups remain visible. The depth selector controls nesting. Drag or use arrows to orbit, adjust elevation, and select a roof to enter its folder. Street gaps preserve district boundaries.
- **Neural connectors:** directed importer-to-dependency module layers with focus, incoming/outgoing traces, boundary references, zoom and exact relationship inspection. Cycles share a semantic layer.
- **Network graph:** the shared global NetworkGraph, search, selection, footprint and legend components. Elastic cables and active flow/pulse/crackle effects use the shared Flow Maker engine.
- **WebGL imports:** native WebGL node/edge view with orbit, zoom, picking and a data table.

The city preserves total counts through depth changes and aggregation. Each district displays at most 24 child groups; remaining small groups are combined. Very large scenes collapse deeper branches after a geometry budget. Hover details and the district list give exact counts.

The connector diagrams use actual file/module graphs, not trained neural-network weights. Partial source evidence remains visible with review details. Node limits are explicit.

## Implementation

`city.ts` owns the hierarchical city partition, projection, drawing and roof picking. `FolderCity.tsx` owns its controls. `FolderBars/` and `NeuralConnectors/` own the dedicated chart components and data models. `useThemedCanvas` handles DPI, theme changes, resize and cleanup with static rendering by default. Optional connector animation pauses offscreen, when the document is hidden and when reduced motion is requested. Chart hover details use the shared SmartTooltip.

Run the `*.test.mjs` files beside these data models to verify aggregation, hierarchy, layout and graph direction.

## Visual references and rendering

The 3D network uses [3d-force-graph](https://github.com/vasturiano/3d-force-graph) with Three.js. The city presentation takes visual direction from [Lusion Digital City](https://exp-digital-city.lusion.co/); it uses repository folder and file counts rather than copied city geometry. The source tools and saved discovery rows remain the data owners.
