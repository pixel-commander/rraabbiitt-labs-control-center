import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";
import type { DesignerAppearance, DesignerState } from "./js/appearance";
export type DesignerMode = "canvas" | "html" | "dev" | "view";
export interface DesignerLayout {
  display?: "block" | "flex" | "grid";
  flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
  justifyContent?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around"
    | "space-evenly";
  alignItems?: "stretch" | "flex-start" | "center" | "flex-end" | "baseline";
  flexWrap?: "nowrap" | "wrap";
  textAlign?: "left" | "center" | "right" | "justify";
  overflow?: "visible" | "hidden" | "auto" | "scroll";
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
  margin?: string;
  flexGrow?: number;
  flexShrink?: number;
}
export interface DesignerElement extends HouseKeys {
  id: number;
  title: string;
  type: "box" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  surface: "main" | "inset" | "float" | "transparent";
  color: "default" | "muted" | "accent" | "secondary" | "success";
  fontSize: number;
  fontWeight?: 400 | 500 | 600 | 700;
  "data-grid"?: string;
  "data-area"?: string;
  grid?: "columns" | "rows";
  cols?: number;
  rows?: number;
  gap?: number;
  padding?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: "none" | "solid" | "dashed" | "dotted" | "double";
  borderRadius?: number;
  boxShadow?: "none" | "float" | "inset";
  opacity?: number;
  appearance?: DesignerAppearance;
  className?: string;
  layout?: DesignerLayout;
  children: DesignerElement[];
}
export interface DesignerClass {
  styles: Partial<DesignerElement>;
}
export interface DesignerDocument extends HouseKeys {
  schema: 1;
  id: number;
  title: string;
  children: DesignerElement[];
  theme?: Record<string, string>;
  mode?: DesignerMode;
  classes?: Record<string, DesignerClass>;
}
export interface DesignerView {
  x: number;
  y: number;
  scale: number;
}
export type DesignerTool = "select" | "box" | "text" | "hand";
export type DesignerAction =
  | "tool"
  | "zoom"
  | "fit"
  | "reset"
  | "undo"
  | "redo"
  | "delete"
  | "new"
  | "save"
  | "open"
  | "export"
  | "escape"
  | "state"
  | "auto"
  | "export-html"
  | "export-component";
export interface DesignerProps extends HouseKeys {
  data: DesignerDocument;
  selected?: number;
  tool: DesignerTool;
  view: DesignerView;
  className?: string;
  previewState: DesignerState;
  autoMode: boolean;
  handleChange: HandlerKey<DesignerDocument, "change", void>;
  handleClick: HandlerKey<{ id?: number }, "select", void>;
  handleView: HandlerKey<DesignerView, "view", void>;
  handleAction: HandlerKey<{ value?: string | number }, DesignerAction, void>;
  handlePreview: HandlerKey<DesignerDocument, "preview", void>;
  canUndo: boolean;
  canRedo: boolean;
  dirty: boolean;
  status: string;
  busy: boolean;
}
