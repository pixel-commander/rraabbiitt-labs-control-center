# Refresh discovery index

Call this tool with a required absolute `root`. Optional `save` defaults to true. A false value returns a live inventory without publishing it.

The tool collects all folders first. Three asynchronous workers then inspect their direct files. It uses the shared ignored-folder list from ScannerStatusUi. Source files stay unchanged.

Saved file rows use numeric `id`, containing folder `path`, full filename `name`, and extension `type`. The optional House `file` field repeats the filename. Folders use their full path, folder name and type folder. House response.paths returns rows, summary.count counts valid locations, summary.total includes error rows if present.

Only complete scans publish a replacement for that root in discovery. Existing IDs remain stable. Other roots stay intact. File read errors preserve the previous index. The component API streams progress, and both API and MCP execution use the current runner and usage recorder.

Validation: `node --test src/dashboards/FilesAndFolders/toolkits/tools/refresh-discovery-index/refresh-discovery-index.test.mjs`.
