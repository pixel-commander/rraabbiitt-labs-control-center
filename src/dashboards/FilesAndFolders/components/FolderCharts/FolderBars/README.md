# Folder Bars

Canvas bar charts for real discovery rows. Pass `folder`, `root`, and `onSelectFolder(path)`.

- Folder grouping partitions immediate child-folder descendants plus direct files. Each file contributes to one bar.
- File-type grouping uses the selected folder's descendant extension counts.
- Sort by count or name, filter group names, and show the first 10, 20 or 40 groups.
- Select file count or percentage of the selected folder. Axis ticks use a common zero baseline.
- Extruded top/end faces give optional 3D depth without changing bar values. Hover for exact counts and composition; select a folder bar to enter its next layer.
- Arrow keys inspect bars. Enter opens the active folder. The exact-data table provides native controls.

The chart discloses visible coverage. Colors use theme tokens, and drawing uses the shared DPR-aware canvas lifecycle. No data or timing is simulated.

Run `node --test src/dashboards/FilesAndFolders/components/FolderCharts/FolderBars/js/bar-model.test.mjs` to check count partitioning and whole-number axis ticks.
