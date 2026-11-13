import type { HandlerKey } from "../../HouseKeys.types";
export type StylerType = "color" | "container" | "action" | "effect" | "grid" | "layout";
export type StylerValue = string | number | undefined;
export interface StylerChange { name: string; value: StylerValue }
export interface StylerPanelProps {
  values?: Record<string, StylerValue>;
  theme_tokens?: Record<string, string>;
  atoms?: Partial<Record<"container" | "action" | "effect", string[]>>;
  color_property?: string;
  handleClick?: HandlerKey<StylerChange, StylerType, void, StylerPanelProps>;
  handleChange?: HandlerKey<StylerChange, StylerType, void, StylerPanelProps>;
}
export interface StylersProps extends StylerPanelProps { types?: StylerType[]; className?: string; }
