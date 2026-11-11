FloatWindow
===========

Controlled floating content window with parent-bounded move and resize gestures and close requests.

Implementation: FloatWindow.tsx
Exports: FloatWindow

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
export interface FloatWindowProps extends Omit<HouseKeys, "title"> {
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
  container_class?: string;
  header_class?: string;
  rect: WindowRect;
  open?: boolean;
  canDrag?: boolean;
  canResize?: boolean;
  actions?: ReactNode;
  handleChange?: HandlerKey<WindowRect, "move" | "resize", void>;
  handleClose?: HandlerKey<undefined, "close", void>;
}


Usage skill
-----------
name: use-float-window
type: skill
path: src/components/FloatWindow
file: use.skill.yaml
instructions: >-
  Render FloatWindow inside a positioned parent with a defined height. Pass rect
  as x,y,width,height in pixels. Parent owns rect and open; apply handleChange
  values on move/resize and handleClose to hide. Supports title, actions, children,
  canDrag, canResize, className and HouseKeys. No persistence or application state.
