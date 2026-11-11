CodeViewer
==========

Controlled code surface with highlighting, gutter, minimap and diagnostic markers.

Implementation: CodeViewer.tsx
Exports: CodeViewer

Render this component with the props below. Application data and persistence remain with the caller.

Customization
-------------
UI classes can be overridden via theme tokens, component tokens, supplied className/container_class/cell_class/event_class props where exposed, or CSS in a parent/external stylesheet. Use only the class props declared by this implementation. The component base class stays in place. An omitted container_class uses the implementation default; an empty string deliberately removes that default. Parent CSS can target the component base class and its documented child classes. Put stylesheet overrides after defaults or in the overrides layer. Tokens must be applied to the component element when it defines its own defaults. Plain functions do not render containers; style the elements supplied to them.

Sizing
------
The caller supplies available layout space. Scroll regions require a bounded grid track and min-block-size: 0. Preview-only dimensions belong in demo files, not reusable component defaults.

Public types
------------
import type { HouseKeys } from "../../../HouseKeys.types";
import type { CSSProperties } from "react";
import type { HandlerKey } from "../../../HouseKeys.types";

export interface CodeDiagnostic {
  message: string;
  severity: "error" | "warning";
  line?: number;
  column?: number;
}
export interface CodeViewerProps extends HouseKeys {
  code: string;
  language?: string;
  mode?: "view" | "edit";
  inline?: boolean;
  showLineNumbers?: boolean;
  showMinimap?: boolean;
  startLine?: number;
  activeLine?: number;
  tabSize?: number;
  disabled?: boolean;
  diagnostics?: CodeDiagnostic[];
  className?: string;
  container_class?: string;
  style?: CSSProperties;
  "aria-label"?: string;
  handleChange?: HandlerKey<{ code: string }, "code-change", void, CodeViewerProps>;
  handleClick?: HandlerKey<
    { line: number },
    "line-click" | "minimap-navigate",
    void,
    CodeViewerProps
  >;
}


Usage skill
-----------
schema: 1
intent: use
id: 1793990737743
name: CodeViewer
path: src/components/CodeEditAndView/CodeViewer
file: CodeViewer.tsx
owner:
  id: 1793990174762
  path: src/components/CodeEditAndView/CodeViewer
  file: rab.settings.json
implementation:
  - path: src/components/CodeEditAndView/CodeViewer
    file: CodeViewer.tsx
instructions: Render CodeViewer with code and handleChange({code}, code-change)
  for editing, or mode=view for display. Optional language, startLine,
  activeLine, tabSize, showLineNumbers, showMinimap, diagnostics, disabled,
  className and style configure the surface. Diagnostics use source lines
  starting at 1, independently of displayed startLine. handleClick receives
  line-click or minimap-navigate. Returns the code surface; does not load, save,
  validate or execute files. Styling uses its CSS and code-viewer token
  defaults.

Editor engine
-------------
The editor uses locally vendored CodeMirror code in hooks/useCodeViewer/code-editor.js.
No CodeMirror npm installation or runtime CDN is required. See LICENSES.txt
for upstream versions, sources, archive hashes and required notices.
The engine owns viewport rendering, selection/caret geometry, undo history,
search and incremental syntax parsing. JS/JSX/TS/TSX, JSON, CSS and HTML syntax
are supported; other languages display as plain text.
The existing code/handler contract, toolbar, validation and saving remain in place.
A full code string is still emitted on edits to preserve the public API. Very
large strings therefore still have an update cost. The minimap is a sampled
monochrome canvas, omitted below 500px component width. Inline mode grows to
content; use a bounded parent for large documents. Ctrl+F searches the complete
document. Tab indents, Shift+Tab outdents, Escape leaves the editor.

Internal ownership
------------------
The existing hooks/useCodeViewer folder owns the editor lifecycle and its local
code-editor.js implementation. code-editor.d.ts declares that implementation's
API; the adapter is already included in code-editor.js. LICENSES.txt combines
upstream provenance and required notices. There is no separate vendor folder,
rebuild script or duplicate adapter source. Save and validation helpers remain
under js/; the replaced tokenizer, indentation and minimap helpers were removed.
