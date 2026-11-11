CodeEditAndView
===============

Code viewing/editing with draft state, diagnostics and validate-before-save handlers.

Implementation: CodeEditAndView.tsx
Exports: CodeEditAndView

Render this component with the props below. Application data and persistence remain with the caller.

Customization
-------------
UI classes can be overridden via theme tokens, component tokens, supplied className/container_class/cell_class/event_class props where exposed, or CSS in a parent/external stylesheet. Use only the class props declared by this implementation. The component base class stays in place. An omitted container_class uses the implementation default; an empty string deliberately removes that default. Parent CSS can target the component base class and its documented child classes. Put stylesheet overrides after defaults or in the overrides layer. Tokens must be applied to the component element when it defines its own defaults. Plain functions do not render containers; style the elements supplied to them.

Sizing
------
The caller supplies available layout space. Scroll regions require a bounded grid track and min-block-size: 0. Preview-only dimensions belong in demo files, not reusable component defaults.

Public types
------------
import type { ReactNode } from "react";
import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";
import type { CodeDiagnostic } from "./CodeViewer/CodeViewer.types";
export interface CodeFile {
  code: string;
  file: string;
  language: string;
  path?: string;
}
export interface CodeEditAndViewProps extends HouseKeys {
  code?: string;
  file?: string;
  language?: string;
  initialMode?: "view" | "edit";
  showLineNumbers?: boolean;
  showMinimap?: boolean;
  startLine?: number;
  tabSize?: number;
  disabled?: boolean;
  className?: string;
  container_class?: string;
  children?: ReactNode;
  handleChange?: HandlerKey<{ code: string }, "code-change", void>;
  handleValidate?: HandlerKey<
    CodeFile,
    "validate-code",
    Promise<CodeDiagnostic[]> | CodeDiagnostic[]
  >;
  handleSave?: HandlerKey<CodeFile, "save-code", Promise<void> | void>;
}


Usage skill
-----------
schema: 1
intent: use
id: 1793990737735
name: CodeEditAndView
path: src/components/CodeEditAndView
file: CodeEditAndView.tsx
owner:
  id: 1793976287997
  path: src/components/CodeEditAndView
  file: rab.settings.json
implementation:
  - path: src/components/CodeEditAndView
    file: CodeEditAndView.tsx
instructions: Render CodeEditAndView with code and file; optional language
  defaults from the file extension. initialMode defaults to edit.
  showLineNumbers/showMinimap default true. Optional handleValidate supplies
  project diagnostics and handleSave supplies persistence. The built-in check
  validates JS/TS syntax or JSON only. Returns editor UI with View/Edit, Check,
  Revert, Save, diagnostics and status. Syntax/project errors block saving; save
  failures appear without replacing the draft. No source code executes. The demo
  saves in memory.

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
