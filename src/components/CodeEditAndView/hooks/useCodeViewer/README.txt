useCodeViewer
=============

Accepts CodeViewerProps. Owns the local editor lifecycle, controlled document
synchronization, viewport reporting and sampled minimap. Returns root/editor/
canvas refs and minimap navigation handlers. Callbacks receive data, type and
the complete incoming props bag. The parent owns code, validation and saving.

Files
-----
useCodeViewer.ts: React lifecycle and minimap owner.
code-editor.js: local CodeMirror implementation with the editor adapter included.
code-editor.d.ts: typed API for that JavaScript implementation.
../../LICENSES.txt: upstream versions, sources, integrity hashes and licenses.

The caller supplies bounded layout space for virtualization. Inline mode grows
to content. Styling belongs to CodeViewer/css/code-viewer.css and its theme tokens.
No installed editor package, network service or source-code execution is required.
