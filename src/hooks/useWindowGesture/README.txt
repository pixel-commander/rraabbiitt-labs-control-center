useWindowGesture
================

Shared pointer-captured, bounded window move and resize behavior with cleanup.

Implementation: useWindowGesture.ts
Exports: useWindowGesture

Call this hook at the top level of a React component. Its implementation owns its interaction lifecycle.

Customization
-------------
UI classes can be overridden via theme tokens, component tokens, supplied className/container_class/cell_class/event_class props where exposed, or CSS in a parent/external stylesheet. Use only the class props declared by this implementation. The component base class stays in place. An omitted container_class uses the implementation default; an empty string deliberately removes that default. Parent CSS can target the component base class and its documented child classes. Put stylesheet overrides after defaults or in the overrides layer. Tokens must be applied to the component element when it defines its own defaults. Plain functions do not render containers; style the elements supplied to them.

Sizing
------
The caller supplies available layout space. Scroll regions require a bounded grid track and min-block-size: 0. Preview-only dimensions belong in demo files, not reusable component defaults.

Public implementation
---------------------
See useWindowGesture.ts for arguments and return values.

Usage skill
-----------
name: use-window-gesture
type: skill
path: src/hooks/useWindowGesture
file: use.skill.yaml
instructions: >-
  Call useWindowGesture(rootRef, options) from a React component. Options contain
  the controlled rect, viewport boolean (default false, bounds use offsetParent),
  handleChange(rect, move-or-resize), and optional handleEnd(rect, gestureType).
  Attach begin(event, move-or-resize, optionalInitialRect) to a drag handle.
  Pointer capture and listeners are cleaned up on release, cancellation, target
  disappearance or unmount. This hook emits geometry; the parent owns the rect.
