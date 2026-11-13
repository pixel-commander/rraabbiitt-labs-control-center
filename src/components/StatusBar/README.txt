StatusBar
=========

A status message with delayed visibility, optional timed dismissal, a color, and a close action.

Implementation: StatusBar.tsx
Exports: StatusBar

Render this component with the props below. Application data and persistence remain with the caller.

Customization
-------------
UI classes can be overridden via theme tokens, component tokens, supplied className/container_class/cell_class/event_class props where exposed, or CSS in a parent/external stylesheet. Use only the class props declared by this implementation. The component base class stays in place. An omitted container_class uses the implementation default; an empty string deliberately removes that default. Parent CSS can target the component base class and its documented child classes. Put stylesheet overrides after defaults or in the overrides layer. Tokens must be applied to the component element when it defines its own defaults. Plain functions do not render containers; style the elements supplied to them.

Sizing
------
The caller supplies available layout space. Scroll regions require a bounded grid track and min-block-size: 0. Preview-only dimensions belong in demo files, not reusable component defaults.

Public types
------------
import type { CSSProperties } from "react";
import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";

export interface StatusBarProps extends HouseKeys {
  status?: string;
  /** Milliseconds before showing the status. */
  delay?: number;
  /** Milliseconds visible when is_open is false. Zero disables the timer. */
  duration?: number;
  /** Keep the status open until manually closed. */
  is_open?: boolean;
  color?: CSSProperties["color"];
  className?: string;
  handleClick?: HandlerKey<string, "close", void>;
}


Usage skill
-----------
schema: 1
intent: use
owner:
  id: 1794000318806
  path: C:/rraabbiitt-react-components/src/components/StatusBar
  file: rab.settings.json
id: 1794000378940
name: use StatusBar
title: Use StatusBar
description: A status message with delayed visibility, optional timed dismissal, a color, and a close action.
type: function
path: C:\rraabbiitt-react-components\src\components\StatusBar
file: use.skill.yaml
tags: []
implementation:
  - path: C:/rraabbiitt-react-components/src/components/StatusBar
    file: StatusBar.tsx
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
