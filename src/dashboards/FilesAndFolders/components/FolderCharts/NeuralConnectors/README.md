# Neural Connectors

Canvas directional module diagram for real resolved import references. Pass the same props as `FolderChartsProps`. The component requests graph mapping only when its Map imports or Refresh graph button is selected.

A node is a file/module. A link runs from importer to dependency. Repeated references to the same target are aggregated as one directional link with the actual reference count. Cyclic modules share a layer. Each semantic layer wraps into presentation lanes of at most 12 modules; extra lanes do not change dependency order. Layer bands expand horizontally, keeping large fan-in groups under 1,100 model pixels high. A topological layout follows import direction after collapsing cycles; chains beyond seven hops are folded into the final column and disclosed.

Choose 30, 60 or 100 modules. The diagram states shown and total node/link counts. The initial selection ranks connected files by reference degree. Selecting a module prioritizes its real neighbors. Include boundary dependencies to show actual resolved edges crossing the selected folder, including built-in modules.

Hover for preview; click to pin. Incoming paths are green and outgoing paths are cyan. Trace controls isolate either direction. The inspector gives reference degrees and selectable incoming/outgoing module lists. The searchable module list supports native keyboard interaction. Canvas arrow keys move focus and Escape clears it. Fit view and zoom (10–140%) help inspect the whole diagram or individual routes. Trace controls isolate incoming or outgoing paths.

No fake edges, artificial neurons, continuous decorative animation or estimated metrics are added. All colors use project theme tokens.

Run `node --test src/dashboards/FilesAndFolders/components/FolderCharts/NeuralConnectors/js/connector-model.test.mjs` to check reference aggregation, directed layering, cycle collapse, boundary scope and focused caps.
