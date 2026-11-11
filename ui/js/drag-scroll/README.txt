drag-scroll
===========

Vanilla pointer drag scrolling with optional flick momentum and smooth programmatic scrolling.

Implementation: drag-scroll.js
Exports: defaultProps, dragScroll

Import the named exports below. Follow the implementation signature; interaction functions return cleanup for the caller to dispose.

Customization
-------------
UI classes can be overridden via theme tokens, component tokens, supplied className/container_class/cell_class/event_class props where exposed, or CSS in a parent/external stylesheet. Use only the class props declared by this implementation. The component base class stays in place. An omitted container_class uses the implementation default; an empty string deliberately removes that default. Parent CSS can target the component base class and its documented child classes. Put stylesheet overrides after defaults or in the overrides layer. Tokens must be applied to the component element when it defines its own defaults. Plain functions do not render containers; style the elements supplied to them.

Sizing
------
The caller supplies available layout space. Scroll regions require a bounded grid track and min-block-size: 0. Preview-only dimensions belong in demo files, not reusable component defaults.

Public types
------------
export interface DragScrollProps {
  flick?: boolean;
  smooth?: boolean;
  sensitivity?: number;
}
export const defaultProps: Readonly<Required<DragScrollProps>>;
export const dragScroll: (ref: HTMLElement | { current: HTMLElement | null } | null, props?: DragScrollProps) => () => void;
export default dragScroll;


Usage skill
-----------
name: use-drag-scroll
type: skill
path: src/js/drag-scroll
file: use.skill.yaml
instructions: >-
  Import dragScroll from drag-scroll.js. Call dragScroll(ref, props) after the
  element mounts; ref is an HTMLElement or an object with current pointing to one.
  The element must already have overflowing content and CSS overflow enabled.
  Options default to flick=true, smooth=true, sensitivity=3. Sensitivity scales
  release momentum: zero disables momentum speed; larger values increase it.
  Dragging stays immediate; smooth sets idle CSS scroll-behavior for programmatic
  scrolling. Touch uses native scrolling. Reduced-motion preference disables
  custom flick. Links and buttons remain clickable until pointer movement reaches
  four pixels; dragging scrolls and suppresses the subsequent click. Native link
  dragging is suppressed during the gesture. Inputs, editable content and explicitly
  draggable elements retain their behavior.
  Returns a cleanup function that removes listeners, cancels momentum and restores
  inline styles. Call cleanup before attaching again or replacing the element.
