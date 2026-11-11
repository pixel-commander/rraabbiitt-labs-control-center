import type { HouseKeys } from "../../../../ui/HouseKeys.types";
import type { CSSProperties } from "react";
import type { HandlerKey } from "../../../../ui/HouseKeys.types";

export interface CodeDiagnostic {
  message: string;
  severity: "error" | "warning";
  line?: number;
  column?: number;
}
export interface CodeViewerProps extends HouseKeys {
  code: string;
  language?: string;
  mode?: "view" | "edit";
  inline?: boolean;
  showLineNumbers?: boolean;
  showMinimap?: boolean;
  startLine?: number;
  activeLine?: number;
  tabSize?: number;
  disabled?: boolean;
  diagnostics?: CodeDiagnostic[];
  className?: string;
  container_class?: string;
  style?: CSSProperties;
  "aria-label"?: string;
  handleChange?: HandlerKey<{ code: string }, "code-change", void, CodeViewerProps>;
  handleClick?: HandlerKey<
    { line: number },
    "line-click" | "minimap-navigate",
    void,
    CodeViewerProps
  >;
}
