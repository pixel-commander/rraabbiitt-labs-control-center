Popup
=====

Controlled docked, floating and CSS fullscreen content shell with dragging, resizing and snap-back requests.

Implementation: Popup.tsx
Exports: Popup

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
import type { WindowRect } from "../../hooks/useWindowGesture/useWindowGesture";
export type PopupMode = "docked" | "floating" | "fullscreen";
export interface PopupValue {
  mode: PopupMode;
  rect: WindowRect;
}
export interface PopupProps extends HouseKeys {
  value: PopupValue;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
  canDrag?: boolean;
  canResize?: boolean;
  canFullscreen?: boolean;
  handleChange?: HandlerKey<
    PopupValue,
    "move" | "resize" | "snap" | "fullscreen" | "restore",
    void
  >;
}


Usage skill
-----------
name: use-popup
type: skill
path: src/components/Popup
file: use.skill.yaml
instructions: >-
  Pass value containing mode (docked, floating, fullscreen) and rect
  (x,y,width,height pixels). Parent applies handleChange(next,type,props).
  Types are move, resize, snap, fullscreen, restore. Dragging docked lifts
  into a viewport-clamped floating window; dropping over its seat snaps back.
  canDrag, canResize and canFullscreen default true. title, actions, children,
  className and HouseKeys are accepted. Fullscreen is CSS, no browser API.
  No data fetching, routing, persistence, dismissal policy or application state.
