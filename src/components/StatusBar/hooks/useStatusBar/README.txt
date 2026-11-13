useStatusBar
============

Toggle StatusBar visibility through a DOM ref and is-open class; manage delay, duration and manual close.

Implementation: useStatusBar.ts
Exports: useStatusBar

Call this hook at the top level of a React component. Its implementation owns its interaction lifecycle.

Customization
-------------
UI classes can be overridden via theme tokens, component tokens, supplied className/container_class/cell_class/event_class props where exposed, or CSS in a parent/external stylesheet. Use only the class props declared by this implementation. The component base class stays in place. An omitted container_class uses the implementation default; an empty string deliberately removes that default. Parent CSS can target the component base class and its documented child classes. Put stylesheet overrides after defaults or in the overrides layer. Tokens must be applied to the component element when it defines its own defaults. Plain functions do not render containers; style the elements supplied to them.

Sizing
------
The caller supplies available layout space. Scroll regions require a bounded grid track and min-block-size: 0. Preview-only dimensions belong in demo files, not reusable component defaults.

Public implementation
---------------------
See useStatusBar.ts for arguments and return values.

Usage skill
-----------
schema: 1
intent: use
owner:
  id: 1794000378912
  path: C:/rraabbiitt-react-components/src/components/StatusBar/hooks/useStatusBar
  file: rab.settings.json
id: 1794000378956
name: use useStatusBar
title: Use useStatusBar
description:
  Toggle StatusBar visibility through a DOM ref and is-open class; manage delay, duration
  and manual close.
type: function
path: C:\rraabbiitt-react-components\src\components\StatusBar\hooks\useStatusBar
file: use.skill.yaml
tags: []
implementation:
  - path: C:/rraabbiitt-react-components/src/components/StatusBar/hooks/useStatusBar
    file: useStatusBar.ts
context: []
inputs: {}
outputs: {}
instructions:
  Render StatusBar with status text, optional color and className. delay and duration
  are milliseconds, defaulting to 0 and 3000. is_open defaults to false; true keeps the message open
  without a duration timer. duration 0 also disables timed dismissal. The close button always hides
  the message, clears timers and calls handleClick(status, "close", props), including when is_open
  is true. Visibility uses a DOM ref and the is-open class, not React state. Changing status, delay,
  duration or is_open reapplies visibility. Uses the side-right grid with message in main and close
  in side. No fixed height.
checks: []
examples: []
routes: []
provenance: []
