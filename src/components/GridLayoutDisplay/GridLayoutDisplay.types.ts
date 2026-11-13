import type { HandlerKey, HouseKeys } from "../../HouseKeys.types";

export type GridTypes = { [type: string]: string[] };

export const gridTypes = {
  "single-cell": ["main"],
  "side-left": ["side", "main"],
  "side-right": ["main", "side"],
  "header-main": ["header", "main"],
  "main-footer": ["main", "footer"],
  shell: ["header", "main", "footer"],
  "side-cols": ["left", "main", "right"],
  "holy-grail": ["header", "left", "main", "right", "footer"],
} satisfies GridTypes;

export type GridType = keyof typeof gridTypes;

export interface GridLayoutDisplayProps extends HouseKeys {
  selected?: GridType;
  className?: string;
  action_class?: string;
  handleClick?: HandlerKey<{ grid: GridType }, "grid-select", unknown, GridLayoutDisplayProps>;
}

export interface GridSelectCellProps extends GridLayoutDisplayProps {
  grid: GridType;
}
