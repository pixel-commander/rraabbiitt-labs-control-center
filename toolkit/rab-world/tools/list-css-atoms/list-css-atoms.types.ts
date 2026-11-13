import type { ToolsProps, ResponseProps, ToolReturn, PathsProps } from "../../../HouseKeys.types.ts";

export interface ListCssAtomsSettings extends ToolsProps {
  /** Atoms directory; defaults to this project's src/atoms. */
  path?: string;
  type?: "container" | "action" | "effect" | "grid";
}
export interface CssAtom extends PathsProps {
  title?: string;
  description?: string;
  tags?: string[];
  class_name: string;
  type: "container" | "action" | "effect" | "grid";
}
export interface ListCssAtomsResponse extends ResponseProps {
  paths: CssAtom[];
}
export interface ListCssAtomsReturn extends ToolReturn {
  response?: ListCssAtomsResponse;
}
