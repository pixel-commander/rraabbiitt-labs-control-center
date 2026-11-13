GridAreaSelect
==============



Implementation: GridAreaSelect.tsx
Exports: GridAreaSelect

Render this component with the props below. Application data and persistence remain with the caller.

Customization
-------------
UI classes can be overridden via theme tokens, component tokens, supplied className/container_class/cell_class/event_class props where exposed, or CSS in a parent/external stylesheet. Use only the class props declared by this implementation. The component base class stays in place. An omitted container_class uses the implementation default; an empty string deliberately removes that default. Parent CSS can target the component base class and its documented child classes. Put stylesheet overrides after defaults or in the overrides layer. Tokens must be applied to the component element when it defines its own defaults. Plain functions do not render containers; style the elements supplied to them.

Sizing
------
The caller supplies available layout space. Scroll regions require a bounded grid track and min-block-size: 0. Preview-only dimensions belong in demo files, not reusable component defaults.

Public types
------------
import type { CSSProperties, ReactNode } from "react";
import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";
export interface GridArea extends HouseKeys {
  id: number;
  r1: number;
  c1: number;
  rows: number;
  cols: number;
  content?: string;
}
export interface GridLayout {
  cols: number;
  rows: number;
  areas: GridArea[];
}
export interface GridAreaSelectProps extends HouseKeys {
  layout: GridLayout;
  selected?: number;
  snap?: boolean;
  disabled?: boolean;
  maxRowSpan?: number;
  mime?: string;
  className?: string;
  style?: CSSProperties;
  renderContent?: (content: string, area: GridArea) => ReactNode;
  handleChange?: HandlerKey<
    GridLayout,
    "move" | "resize" | "remove" | "drop",
    void
  >;
  handleCreate?: HandlerKey<Omit<GridArea, "id">, "create", void>;
  handleClick?: HandlerKey<GridArea | null, "select", void>;
  handleDrop?: HandlerKey<{ area: GridArea; content: string }, "drop", void>;
}


Usage skill
-----------
name: use-grid-area-select
type: skill
path: src/components/GridAreaSelect
file: use.skill.yaml
instructions: >-
  Supply controlled layout {cols, rows, areas}. Each area has numeric id, r1/c1
  one-based starts, rows/cols spans, optional name/title and content ID. Parent owns
  IDs, layout and selected id. Keep areas in bounds and nonoverlapping. handleCreate
  receives a proposed rectangle without id; parent adds it. handleChange receives
  replacement serializable layout and move/resize/remove/drop. handleClick receives
  selected area or null. snap links directly touching neighbors during resize.
  maxRowSpan caps new and resized areas. renderContent(content, area) renders IDs.
  handleDrop reports area/content; handleChange also proposes the updated layout.
  mime defaults text/x-drop-load-id with text/plain fallback. disabled prevents
  editing. All callbacks use shared HandlerKey data/type/props. No persistence,
  context, dialogs, routing or fetching. Replace layout to restore caller data.
