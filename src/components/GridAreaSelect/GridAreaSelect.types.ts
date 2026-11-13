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
