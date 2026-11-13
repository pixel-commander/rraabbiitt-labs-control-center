RailCanvas
==========

Animated canvas frame rail with neon tubes, LEDs, and mechanical detailing.

Implementation: RailCanvas.tsx
Exports: RailCanvas

Render this component with the props below. Application data and persistence remain with the caller.

Customization
-------------
UI classes can be overridden via theme tokens, component tokens, supplied className/container_class/cell_class/event_class props where exposed, or CSS in a parent/external stylesheet. Use only the class props declared by this implementation. The component base class stays in place. An omitted container_class uses the implementation default; an empty string deliberately removes that default. Parent CSS can target the component base class and its documented child classes. Put stylesheet overrides after defaults or in the overrides layer. Tokens must be applied to the component element when it defines its own defaults. Plain functions do not render containers; style the elements supplied to them.

Sizing
------
The caller supplies available layout space. Scroll regions require a bounded grid track and min-block-size: 0. Preview-only dimensions belong in demo files, not reusable component defaults.

Public types
------------
import type { HouseKeys } from "../../../HouseKeys.types";
export interface RailTube {
  color: string;
  top: number;
  height: number;
}

export interface RailLed {
  color: string;
  top: number;
  can_blink?: boolean;
}

export interface RailCorner {
  at?: "start" | "end";
  color: string;
  length?: number;
}

export interface RailCanvasProps extends HouseKeys {
  side?: "left" | "right" | "top" | "bottom";
  corner?: RailCorner;
  tubes?: RailTube[];
  leds?: RailLed[];
  joints?: number[];
  can_animate?: boolean;
  className?: string;
}

