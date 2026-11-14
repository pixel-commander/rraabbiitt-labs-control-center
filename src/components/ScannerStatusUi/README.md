# Scanner Status

Use this component to open a live filesystem discovery window.

```tsx
<ScannerStatusUi root={projectRoot} handleComplete={refreshFolderView} />
```

The button opens a native dialog and starts the first scan. Reopening shows the latest result. Rescan starts another scan. Close and Escape hide the dialog; they do not cancel work.

The component owns its button, dialog, folder timeline, rolling activity, stats, fetch state, and theme styles. Its API transport is in `api/scan.mjs`. Filesystem tools and the discovery store live with the FilesAndFolders dashboard, under `toolkits/`. There are no runtime imports from the old project.

## Scan behavior

The registered `refresh-discovery-index` tool first collects the complete folder array. Three asynchronous filesystem workers then read each folder's direct files. These are Node asynchronous workers, not browser service workers. A folder branch completes after all its queued descendants finish. The copied ignored-folder list lives in `ignored-folders.json`; project cache and Python environment folders are also excluded. Both scans and finds use that list.

The scan button calls runner-refresh-discovery, which executes the tool through the shared execution owner and usage recorder. A successful scan atomically replaces only its root's discovery rows. Read or save errors preserve the previous rows. Existing locations retain their numeric IDs. The `discovery` table describes filesystem locations, not registered tools. File rows use parent directory in `path`, full filename in `name` and `file`, and extension without a dot in `type`. Folder rows use the full folder path and `type: folder`.

## Props

- `root`: required absolute crawl root.
- `save`: default true. False returns inventory without saving.
- `button_label`: optional launch label.
- `handleComplete`: receives the tracked tool result after completion. The streamed UI result omits the large paths array; the full return stays in run history.
- `children` and `className`: optional content and dialog styling.

The folder timeline is independent of the activity window. Only the last 50 activity messages are displayed. Progress is coalesced at 50 ms; file/folder counts remain actual scan totals. The UI shows errors separately and never claims an incomplete scan was published. There is no durable resume or cancellation control.

The Files and Folders page connects the scanner to the saved-index explorer. The Style Guide has a live demo.
