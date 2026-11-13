ProgressBar
===========

Controlled progress fill with automatic fraction/percent interpretation, explicit scale, clamping and optional labels.

Implementation: ProgressBar.tsx
Exports: ProgressBar

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
import type { HouseKeys } from "../../HouseKeys.types";
export interface ProgressBarProps extends HouseKeys {
  children?: ReactNode;
  className?: string;
  value?: number;
  scale?: "auto" | "fraction" | "percent";
  label?: boolean | string;
}


Usage skill
-----------
name: use-progress-bar
type: skill
path: src/components/ProgressBar
file: use.skill.yaml
instructions: >-
  Import ProgressBar and pass value. Default scale auto accepts a fraction up to 1
  or a percentage above 1; use scale percent to represent exactly 1 percent, or
  scale fraction for explicit fractional values. Values clamp to 0–100 and nonfinite
  values render as zero. label true displays a percentage; a string supplies custom
  text. title or name labels the accessible progressbar. No state or side effects.
