drag-sort
=========

Native drag sorting that reports reordered IDs without moving React-owned rows.

Implementation: drag-sort.js
Exports: defaultProps, dragSort

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
export interface DragSortResult {
  ids: string[];
  from: number;
  to: number;
}
export interface DragSortProps extends HouseKeys {
  item_selector?: string;
  handleSort?: HandlerKey<DragSortResult, "drag-sort", void>;
}
export const defaultProps: Readonly<{ item_selector: string }>;
export const dragSort: (
  ref: HTMLElement | { current: HTMLElement | null } | null,
  props?: DragSortProps,
) => () => void;
export default dragSort;


Usage skill
-----------
schema: 1
intent: use
owner:
  id: 1794003953594
  path: C:/rraabbiitt-react-components/src/js/drag-sort
  file: rab.settings.json
id: 1794003953621
name: use drag-sort
title: Use Drag sort
description: Native drag sorting that reports reordered IDs without moving React-owned rows.
type: function
path: C:\rraabbiitt-react-components\src\js\drag-sort
file: use.skill.yaml
tags: []
implementation:
  - path: C:/rraabbiitt-react-components/src/js/drag-sort
    file: drag-sort.js
context: []
inputs: {}
outputs: {}
instructions:
  Import dragSort from drag-sort.js and call dragSort(ref, props) after mount; return
  its cleanup from the effect. Supply data-sort-id on sibling rows for stable string IDs, or the
  original sibling indexes are used. item_selector defaults to [data-sort-id], falling back to
  direct children. Rows must share a parent. handleSort({ ids, from, to }, "drag-sort", props)
  reports order; the parent must reorder its data. Native HTML drag gestures coexist with
  dragScroll; inputs, buttons, links, editable and data-no-drag controls are excluded. The function
  marks rows draggable, observes new rows, inserts a temporary drop-slot, and restores original
  draggable attributes and removes the placeholder on cleanup. Style drag-source and drop-slot in
  caller CSS. No injected stylesheet.
checks: []
examples: []
routes: []
provenance:
  - path: Z:/control-center/__shared/js
    file: drag-sort.js
    description: User supplied reference; adapted for local contracts and cleanup.
