FullScreenWrapper
=================

Controlled title/actions/content shell with CSS fullscreen and restore requests.

Implementation: FullScreenWrapper.tsx
Exports: FullScreenWrapper

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
export interface FullScreenWrapperProps extends HouseKeys {
  children?: ReactNode;
  className?: string;
  container_class?: string;
  full?: boolean;
  heading?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  handleChange?: HandlerKey<{ full: boolean }, "fullscreen", void>;
}


Usage skill
-----------
name: use-full-screen-wrapper
type: skill
path: src/components/FullScreenWrapper
file: use.skill.yaml
instructions: >-
  Render FullScreenWrapper with children and title or heading. Supply controlled
  full (default false) and handleChange(data, fullscreen, props); data is {full}.
  The parent must apply the returned full value. actions and icon accept React
  content. The toggle requests fullscreen or restore; Escape requests restore.
  CSS fullscreen only, without browser fullscreen API, persistence or global state.
