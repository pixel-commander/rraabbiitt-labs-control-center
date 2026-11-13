import type { factorySizes } from "./js/sizeStyles";
import type { ReactNode, RefObject } from "react";
import type { HandlerKey, HouseKeys } from "../../../../HouseKeys.types";
import type { GridType } from "../../../../components/GridLayoutDisplay/GridLayoutDisplay.types";
import type { GridLayout } from "../../../../components/GridAreaSelect/GridAreaSelect.types";
import type { TabNavItem } from "../../../../components/TabNav/TabNav.types";

export interface ComponentFactoryProps extends HouseKeys {
  /** Nested composition JSON (object or serialized JSON). Changes load a new document. */
  json?: FactoryDocument | FactoryNode | FactoryComposition | string;
  children?: ReactNode;
  theme_tokens?: { [key: string]: string };
  layout_tokens?: { [key: string]: string };
  className?: string;
  handleClick?: HandlerKey<{}, "new" | "open" | "export" | "save", unknown, ComponentFactoryProps>;
  handleSubmit?: HandlerKey<FactoryDocument, "save", unknown, ComponentFactoryProps>;
}

export interface FactoryNode {
  id: number;
  name: string;
  tag: FactoryLayoutTag | FactoryHeadline | "button" | "a" | "p" | "strong" | "em" | "small" | "ul" | "ol" | "li";
  container_class?: string;
  action_class?: string;
  effect_class?: string;
  grid_type?: GridType;
  grid_area?: string;
  grid_rows?: number;
  grid_cols?: number;
  scroll_x?: boolean;
  scroll_y?: boolean;
  padding?: string | number | Partial<Record<PaddingSide, string | number>>;
  gap?: string | number;
  css?: import("react").CSSProperties;
  text?: string;
  href?: string;
  disabled?: boolean;
  /** Optional drawn-grid and action-state controls. */
  grid_custom?: GridLayout;
  grid_spans?: FactoryGridLayout["spans"];
  states?: FactoryElement["states"];
  children?: FactoryNode[];
}

/** Private compatibility projection for the existing editor controls; never exported. */
export interface EditorFactoryNode {
  id: number;
  name: string;
  tag: FactoryNode["tag"];
  kind?: "area";
  /** Named grid area, or a stable key for a custom grid cell. */
  area?: string;
  container_class?: string;
  atom_class?: string;
  effect_class?: string;
  css?: import("react").CSSProperties;
  text?: string;
  href?: string;
  disabled?: boolean;
  layout?: FactoryGridLayout;
  style?: FactorySurfaceStyle & Partial<FactoryElement>;
  states?: FactoryElement["states"];
  children?: EditorFactoryNode[];
}

export interface EditorFactoryDocument extends Omit<FactoryDocument, "root"> { root: EditorFactoryNode }

export interface FactoryDocument extends HouseKeys {
  /** Database record identity; independent of an artifact scaffold's id. */
  composition_id?: number;
  version: 2;
  root: FactoryNode;
  colors?: Record<string, string>;
  /** Canvas-only geometry; never emitted into component markup. */
  editor?: { frame: FactoryFrame };
}

export interface SettingsColProps extends HouseKeys {
  className?: string;
  data_area?: string;
  tabs: string[];
  selected?: string;
  children?: ReactNode;
  footer?: ReactNode;
  handleClick?: HandlerKey<TabNavItem, "tab-nav", void, SettingsColProps>;
}

export interface HeaderProps extends ComponentFactoryProps {
  handleViewJson?: () => void;
  component_name?: string;
  handleChange?: HandlerKey<string, "component-name", void, HeaderProps>;
}

export interface FooterProps extends ComponentFactoryProps {
  container_ref?: RefObject<HTMLDivElement | null>;
  background?: FactoryTheme;
  handleChange?: HandlerKey<FactoryTheme, "canvas-background", void, FooterProps>;
}
export type FactoryElementType = "Text" | "Headline" | "Div" | "Button" | "Link";
export type FactoryLayoutTag = "article" | "aside" | "div" | "footer" | "header" | "main" | "nav" | "section" | "span";
export type FactoryHeadline = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export type FactoryTheme = "dark" | "light";
export type FactorySize = (typeof factorySizes)[number];
export type FactorySizeValue = FactorySize | number;
export type PaddingSide = "left" | "top" | "right" | "bottom";
export type RadiusCorner = "top-left" | "top-right" | "bottom-right" | "bottom-left";

export type FactoryDisplay = "block" | "grid" | "flex" | "inline" | "inline-block" | "inline-grid" | "inline-flex";

export interface FactoryGridLayout {
  custom?: GridLayout;
  grid?: GridType;
  rows?: number;
  cols?: number;
  spans?: Record<number, { rows?: number; cols?: number }>;
}

export interface FactoryPadding {
  padding?: FactorySizeValue;
  paddingAll?: boolean;
  paddingSides?: Partial<Record<PaddingSide, FactorySizeValue>>;
}

export interface FactoryElement extends FactoryPadding {
  nodeName?: string;
  nodeTag?: FactoryNode["tag"];
  css?: import("react").CSSProperties;
  childArea?: string;
  paint?: FactoryPaint;
  states?: Partial<Record<FactoryActionState, FactoryPaint>>;
  id: number;
  area: string;
  type: FactoryElementType;
  layoutTag?: FactoryLayoutTag;
  href?: string;
  text: string;
  color: string;
  size: number;
  heading: FactoryHeadline;
  container: string;
  effect: string;
  action: string;
  disabled?: boolean;
  gap?: FactorySize;
  scrollX?: boolean;
  scrollY?: boolean;
  display?: FactoryDisplay;
  gridLayout?: FactoryGridLayout;
}

export interface FactoryFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FactorySurfaceStyle extends FactoryPadding {
  css?: import("react").CSSProperties;
  width?: number;
  height?: number;
  paddingX?: FactorySize | number;
  paddingY?: FactorySize | number;
  gap?: FactorySize;
  horizontalAlign?: "start" | "center" | "end";
  verticalAlign?: "start" | "center" | "end";
  scrollY?: boolean;
  paint?: FactoryPaint;
  gridLayout?: FactoryGridLayout;
  container?: string;
  effect?: string;
}

export interface FactoryComposition extends HouseKeys {
  rootTag?: FactoryNode["tag"];
  name?: string;
  colors?: Record<string, string>;
  grid: GridType;
  frame: FactoryFrame;
  elements: FactoryElement[];
  gridStyle?: FactorySurfaceStyle;
  areaStyles?: Record<string, FactorySurfaceStyle>;
}

export type FactoryPaint = {
  background?: string;
  gradient?: boolean;
  gradientEnd?: string;
  angle?: number;
  radius?: FactorySize | number;
  radiusAll?: boolean;
  radiusCorners?: Partial<Record<RadiusCorner, FactorySizeValue>>;
  borders?: Partial<Record<"all" | "top" | "right" | "bottom" | "left", { width?: number; style?: string; color?: string }>>;
  shadows?: FactoryShadow[];
};

export type FactoryShadow = {
  inset: boolean;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
};

export type FactoryActionState = "default" | "selected" | "hover" | "disabled" | "mousedown";

export interface FactoryEditorProps extends HouseKeys {
  editor: ReturnType<typeof import("./hooks/useComponentFactory/useComponentFactory").useComponentFactory>;
}
