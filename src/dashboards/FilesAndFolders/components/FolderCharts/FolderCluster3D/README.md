# Folder Cluster 3D

The primary `FolderCluster3D` component uses the user-selected `3d-force-graph` package with Three.js/WebGL. It does not replace that renderer with a projected 2D imitation.

Pass `{ folder, onSelectFolder? }`, where `folder` is the saved discovery folder tree. Every graph node is a real folder and every graph link is its actual parent-child relationship. No sample nodes or synthetic network edges are injected.

The default opens the full hierarchy with an explicit 1,500-node cap. Use Three layers, Expand all, Collapse, or the folder buttons to change visible branches. Clicking a node expands or collapses it. Shift-click or Fly to folder moves the actual 3D camera to that cluster. Drag to orbit; use the wheel to zoom. The native folder inspector and searchable path list provide alternatives to canvas interaction.

Initial positions are volumetric, recursively nested sphere seeds. The package's real D3 3D force engine then lays out the hierarchy. Newly expanded nodes start at their parent's current position. Cached existing node objects preserve their simulated coordinates when other branches open or close.

Node radius uses log descendant file count. Emissive sphere materials, directional link particles, bloom, and auto orbit use theme colors. Bloom is followed by Three's OutputPass for correct output color space. Markers indicate hierarchy direction, not measured live traffic.

Automatic rendering pauses when the graph is offscreen or the document is hidden. Reduced-motion disables automatic orbit, particles and continuous simulation; interaction wakes a short render burst. Resize/theme observers, listeners, force-graph instance, geometry, materials, texture and postprocessing passes are disposed on unmount.

The earlier projected-canvas implementation is preserved as `FolderClusterCanvas` in `FolderClusterCanvas.tsx`, using its existing CSS and the same real hierarchy model. The dashboard can offer both views.

## Check

`node --test src/dashboards/FilesAndFolders/components/FolderCharts/FolderCluster3D/js/cluster-model.test.mjs`

The tests cover expansion/collapse, actual edges, full hierarchy counts, visible caps and volumetric seed geometry.

## Upstream

- [3d-force-graph](https://github.com/vasturiano/3d-force-graph)
- [Expandable nodes example](https://vasturiano.github.io/3d-force-graph/example/expandable-nodes/)
- [Bloom effect example](https://vasturiano.github.io/3d-force-graph/example/bloom-effect/)
