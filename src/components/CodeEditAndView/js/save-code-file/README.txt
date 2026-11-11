save-code-file
==============

save-code-file: function implementation. See README.txt for the exported contract and integration.

Implementation: save-code-file.ts
Exports: saveCodeFile

Import the named exports below. Follow the implementation signature; interaction functions return cleanup for the caller to dispose.

Customization
-------------
UI classes can be overridden via theme tokens, component tokens, supplied className/container_class/cell_class/event_class props where exposed, or CSS in a parent/external stylesheet. Use only the class props declared by this implementation. The component base class stays in place. An omitted container_class uses the implementation default; an empty string deliberately removes that default. Parent CSS can target the component base class and its documented child classes. Put stylesheet overrides after defaults or in the overrides layer. Tokens must be applied to the component element when it defines its own defaults. Plain functions do not render containers; style the elements supplied to them.

Sizing
------
The caller supplies available layout space. Scroll regions require a bounded grid track and min-block-size: 0. Preview-only dimensions belong in demo files, not reusable component defaults.

Public implementation
---------------------
See save-code-file.ts for arguments and return values.

Usage skill
-----------
schema: 1
intent: use
id: 1793990737717
name: saveCodeFile
type: skill
path: src/components/CodeEditAndView/js/save-code-file
file: save-code-file.ts
owner:
  id: 1793990737715
  path: src/components/CodeEditAndView/js/save-code-file
  file: settings.json
implementation:
  - path: src/components/CodeEditAndView/js/save-code-file
    file: save-code-file.ts
instructions: Call await saveCodeFile({ code, file, language, path? },
  handleSave). Invokes the supplied handler with the file bag and save-code
  action. Resolves after the handler completes; throws if no handler is supplied
  or saving fails. Does not supply a filesystem backend.
