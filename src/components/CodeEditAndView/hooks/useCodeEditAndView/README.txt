useCodeEditAndView
==================

useCodeEditAndView: hook implementation. See README.txt for the exported contract and integration.

Implementation: useCodeEditAndView.ts
Exports: useCodeEditAndView

Call this hook at the top level of a React component. Its implementation owns its interaction lifecycle.

Customization
-------------
UI classes can be overridden via theme tokens, component tokens, supplied className/container_class/cell_class/event_class props where exposed, or CSS in a parent/external stylesheet. Use only the class props declared by this implementation. The component base class stays in place. An omitted container_class uses the implementation default; an empty string deliberately removes that default. Parent CSS can target the component base class and its documented child classes. Put stylesheet overrides after defaults or in the overrides layer. Tokens must be applied to the component element when it defines its own defaults. Plain functions do not render containers; style the elements supplied to them.

Sizing
------
The caller supplies available layout space. Scroll regions require a bounded grid track and min-block-size: 0. Preview-only dimensions belong in demo files, not reusable component defaults.

Public implementation
---------------------
See useCodeEditAndView.ts for arguments and return values.

Usage skill
-----------
schema: 1
intent: use
id: 1793990737729
name: useCodeEditAndView
type: skill
path: src/components/CodeEditAndView/hooks/useCodeEditAndView
file: useCodeEditAndView.ts
owner:
  id: 1793990737728
  path: src/components/CodeEditAndView/hooks/useCodeEditAndView
  file: settings.json
implementation:
  - path: src/components/CodeEditAndView/hooks/useCodeEditAndView
    file: useCodeEditAndView.ts
instructions: Call useCodeEditAndView(props) inside React. Accepts
  CodeEditAndViewProps and returns draft, saved baseline, dirty/mode/pending
  state, diagnostics/messages, and change/revert/navigate/setMode/validate/save
  actions. Initial code or a new file/path loads a document; echoes of emitted
  changes preserve the saved baseline. Syntax errors block saving.
  handleValidate provides optional project checks; handleSave provides
  persistence. Errors become state and stale validation is discarded. No code
  executes.
