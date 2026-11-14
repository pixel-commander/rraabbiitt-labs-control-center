# Files and Folders toolkit

This toolkit belongs to the Files and Folders dashboard. It provides filesystem discovery, saved finders and project audits. The scanner window is a global component. It calls this toolkit through the existing execution system.

## Locations

- `tools/`: one operation per folder. Each tool keeps its usage recorder.
- `runners/`: refresh and audit workflows. Both use the shared execution owner.
- `_shared/`: source parsing, discovery queries, preset storage and HTTP transport.
- `FilesAndFolders.types.ts`: finder settings, location rows and report types.

`discovery` stores the folder and file inventory. It is separate from the tool catalog. File rows use `id`, containing-folder `path`, full filename `name`, extension `type`, and the compatible `file` field. Folder rows use their full folder path and type `folder`. The table also keeps the scan root and update date.

## Finder settings

```json
{
  "root": "X:\\rraabbiitt-labs-control-center",
  "path": "src/components",
  "name": "Chart",
  "type": "tsx",
  "db": true
}
```

`root` is required. Omit `path` to search the root. A supplied path must remain inside the root. File names use case-insensitive substring matching. Extensions can include a leading dot.

Set `db` to true to select files and folders from saved discovery rows. The finder does not refresh the index. Source-content tools still read those selected files. File-type byte totals use current file sizes. The result states whether it used saved discovery or a live filesystem scan.

## Tools

| Name | Purpose | Summary count | Summary total |
| --- | --- | --- | --- |
| `refresh-discovery-index` | Collect all folders, then read their direct files with three asynchronous workers. Save only a complete root inventory. | Valid discovered rows | All returned rows |
| `find-files-and-folders` | Match location names and extensions. | Matching rows | Eligible location rows |
| `find-in-files` | Find identifiers and text through the TypeScript AST. Optional text mode also searches comments. | Matching AST nodes or text lines | Files inspected |
| `count-imports` | Map imports, re-exports, dynamic imports and require calls. Return reverse references and external dependency groups. | Module references | Files in the root inventory |
| `count-file-types` | Group file counts and bytes by extension. | Matching files | Files in the scope |
| `list-orphaned-files` | List files without incoming module references as candidates for review. | Candidates | Files in the root inventory |
| `finder-presets` | Save, update and list favorite finder settings. | Returned presets | Returned presets |

Tools return House `ToolReturn`. Results use `response.paths` and `response.summary`. `response.body` is a JSON string with state, errors and details. Import details include `references`, `by_source` and `external_dependencies`.

Orphan candidates are not proof that a file is unused. Entry points, tests, nonliteral loading, HTML and CSS references need separate review. An incomplete import graph suppresses the candidate list. No audit deletes or repairs source files.

Use `limit` and `offset` to page returned locations. Summary counts describe the full match set. To save a report, supply an existing `save_path` and an optional plain `save_file` stem. The tool writes JSON and text reports. It refuses existing report files.

## Saved finders

Call `finder-presets` with action `save`, a preset `name`, the finder `tool` name, and its `settings` object. Optional `favorite` defaults to true. Supply the existing numeric `id` to update a preset.

Action `list` can filter by `id`, `root` or `favorite`. Settings live in the `finder_presets` table as JSON. Saving a preset does not run it. Six initial favorites cover TSX components, folders, Chart references, file types, imports and orphan candidates.

## Runners

`runner-refresh-discovery` accepts one `root` or a nonempty House `paths` array. It executes each root separately. Each root remains visible in the flat tracked return.

`runner-files-and-folders-audits` accepts `root` and optional `checks`. The default checks are `count-imports`, `count-file-types` and `list-orphaned-files`. Set `refresh` to true to refresh first. Audits use `db: true` by default. A failed or incomplete refresh skips the audits rather than using stale inventory.

Both runners return the shared `RunnerReturn`. The shared owner records timings and execution history. Read child errors as well as completion status. A complete operation can still have incomplete audit evidence.

## HTTP transport

The application server applies its existing Host, Origin and token rules before these routes.

- `GET /api/files-and-folders/discovery?root=...`: read flat discovery rows. Optional `path`, `limit` and `offset` apply. The default limit is 100,000. The body reports truncation. A root with no saved index returns an empty not-indexed state.
- `POST /api/files-and-folders/tools`: submit `{ "name": "count-imports", "settings": { "root": "...", "db": true } }`. The endpoint permits only the toolkit's named tools and runners. It calls the master runner and returns its tracked steps.

The scan stream transport remains inside the ScannerStatusUi component. It calls runner-refresh-discovery through the master dispatcher; that runner executes the registered refresh tool.

## Verification

Run `node --test src/dashboards/FilesAndFolders/toolkits/_shared/finders.test.mjs`.

Tests use temporary folders and databases. They check scopes, AST versus text, reverse imports, incomplete orphan graphs, saved-index behavior, report saving, favorite settings and runner failure handling. Temporary data is removed after each test.

The refresh workers also record each regular file's measured byte size in `discovery.size`. Older snapshots return unknown sizes until refreshed. Folder totals are available only when all descendant file sizes are known; charts must not substitute file counts for bytes.
