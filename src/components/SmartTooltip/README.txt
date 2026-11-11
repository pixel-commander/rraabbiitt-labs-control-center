SmartTooltip
============

Pointer-following tooltip with React content, viewport-aware placement, and a body portal that escapes clipped containers.

Implementation: SmartTooltip.tsx
Exports: SmartTooltip

Render this component with the props below. Application data and persistence remain with the caller.

Customization
-------------
UI classes can be overridden via theme tokens, component tokens, supplied className/container_class/cell_class/event_class props where exposed, or CSS in a parent/external stylesheet. Use only the class props declared by this implementation. The component base class stays in place. An omitted container_class uses the implementation default; an empty string deliberately removes that default. Parent CSS can target the component base class and its documented child classes. Put stylesheet overrides after defaults or in the overrides layer. Tokens must be applied to the component element when it defines its own defaults. Plain functions do not render containers; style the elements supplied to them.

Sizing
------
The caller supplies available layout space. Scroll regions require a bounded grid track and min-block-size: 0. Preview-only dimensions belong in demo files, not reusable component defaults.

Public types
------------
import type { HouseKeys } from "../../HouseKeys.types";
import type { ReactNode, RefObject } from "react";

export type SmartTooltipPlacement =
  "above" | "below" | "left" | "right" | "before" | "after";
export interface SmartTooltipPosition {
  x: number;
  y: number;
}

export interface SmartTooltipProps extends Omit<HouseKeys, "title"> {
  /** Element whose bounds activate the tooltip. */
  targetRef: RefObject<Element | null>;
  /** Controlled tooltip body; update it with the caller's React state. */
  content?: ReactNode;
  /** Optional heading rendered above the tooltip body. */
  title?: ReactNode;
  /** Composable tooltip body, including formatted markup or other components. */
  children?: ReactNode;
  /** Preferred side of the pointer; flips when the viewport has no room. */
  placement?: SmartTooltipPlacement;
  /** When true, unmounts the portal and its pointer/viewport listeners. */
  disabled?: boolean;
  /** Optional live anchor position used by ChartTooltip's snap_to_point mode. */
  positionRef?: RefObject<SmartTooltipPosition | null>;
  className?: string;
  container_class?: string;
}

