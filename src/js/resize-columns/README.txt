resize-columns
==============

Resize left and right grid columns through refs, CSS variables and a HouseKeys callback.

Implementation: resize-columns.js
Exports: defaultProps, resizeColumns

Import the named exports below. Follow the implementation signature; interaction functions return cleanup for the caller to dispose.

Customization
-------------
UI classes can be overridden via theme tokens, component tokens, supplied className/container_class/cell_class/event_class props where exposed, or CSS in a parent/external stylesheet. Use only the class props declared by this implementation. The component base class stays in place. An omitted container_class uses the implementation default; an empty string deliberately removes that default. Parent CSS can target the component base class and its documented child classes. Put stylesheet overrides after defaults or in the overrides layer. Tokens must be applied to the component element when it defines its own defaults. Plain functions do not render containers; style the elements supplied to them.

Sizing
------
The caller supplies available layout space. Scroll regions require a bounded grid track and min-block-size: 0. Preview-only dimensions belong in demo files, not reusable component defaults.

Public types
------------
import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";
export interface ResizeColumnsResult {
  side: "left" | "right";
  width: number;
}
export interface ResizeColumnsProps extends HouseKeys {
  grip_selector?: string;
  min_rem?: number;
  max_rem?: number;
  handleChange?: HandlerKey<ResizeColumnsResult, "resize-columns", void>;
}
export const defaultProps: Readonly<{
  grip_selector: string;
  min_rem: number;
  max_rem: number;
}>;
export const resizeColumns: (
  ref: HTMLElement | { current: HTMLElement | null } | null,
  props?: ResizeColumnsProps,
) => () => void;
export default resizeColumns;


Usage skill
-----------
schema: 1
intent: use
owner:
  id: 1794003953633
  path: C:/rraabbiitt-react-components/src/js/resize-columns
  file: rab.settings.json
id: 1794003953640
name: use resize-columns
title: Use Resize columns
description: Resize left and right grid columns through refs, CSS variables and a HouseKeys callback.
type: function
path: C:\rraabbiitt-react-components\src\js\resize-columns
file: use.skill.yaml
tags: []
implementation:
  - path: C:/rraabbiitt-react-components/src/js/resize-columns
    file: resize-columns.js
context: []
inputs: {}
outputs: {}
instructions:
  Import resizeColumns from resize-columns.js and call resizeColumns(ref, props) after
  mount; return cleanup from the effect. Put data-resize="left" or "right" on grips inside the root
  and apply touch-action:none to grips. grip_selector defaults to [data-resize]. The root must be a
  grid with resolved pixel tracks. Consume --left-w and --right-w on the corresponding side
  elements; house sides grid retains layout ownership. Widths are rem units, clamped by min_rem=6
  and max_rem=34. handleChange({ side, width }, "resize-columns", props) reports each move. One
  primary pointer is accepted; release, cancel, lost capture, blur and cleanup detach active
  listeners and restore interaction styles. Final width CSS variables remain on the root.
checks: []
examples: []
routes: []
provenance:
  - path: Z:/control-center/__shared/js
    file: resize-columns.js
    description: User supplied reference; adapted for local contracts and cleanup.
