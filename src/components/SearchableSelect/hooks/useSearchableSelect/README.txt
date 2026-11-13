useSearchableSelect
===================

Manage selectable records, input filtering, and keyboard navigation.

Implementation: useSearchableSelect.ts
Exports: useSearchableSelect

Call this hook at the top level of a React component. Its implementation owns its interaction lifecycle.

Customization
-------------
UI classes can be overridden via theme tokens, component tokens, supplied className/container_class/cell_class/event_class props where exposed, or CSS in a parent/external stylesheet. Use only the class props declared by this implementation. The component base class stays in place. An omitted container_class uses the implementation default; an empty string deliberately removes that default. Parent CSS can target the component base class and its documented child classes. Put stylesheet overrides after defaults or in the overrides layer. Tokens must be applied to the component element when it defines its own defaults. Plain functions do not render containers; style the elements supplied to them.

Sizing
------
The caller supplies available layout space. Scroll regions require a bounded grid track and min-block-size: 0. Preview-only dimensions belong in demo files, not reusable component defaults.

Public implementation
---------------------
See useSearchableSelect.ts for arguments and return values.

Usage skill
-----------
schema: 1
intent: use
owner:
  id: 1793796407955
  path: src/components/SearchableSelect/hooks/useSearchableSelect/rab.settings.json
id: 1793796407958
name: use-searchable-select
title: Searchable select
description: Manage selectable records, input filtering, and keyboard navigation.
type: skill
path: src/components/SearchableSelect/hooks/useSearchableSelect
file: use.skill.yaml
tags:
  - react
  - hook
implementation:
  - path: src/components/SearchableSelect/hooks/useSearchableSelect/useSearchableSelect.ts
context: []
inputs: {}
outputs: {}
instructions: Pass the select props and bind the returned ref and handlers to
  the select controls.
checks: []
examples: []
routes: []
provenance: []
