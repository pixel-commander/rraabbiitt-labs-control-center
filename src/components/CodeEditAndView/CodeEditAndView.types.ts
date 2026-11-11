import type { ReactNode } from "react";
import type { HouseKeys, HandlerKey } from "../../../ui/HouseKeys.types";
import type { CodeDiagnostic } from "./CodeViewer/CodeViewer.types";
export interface CodeFile {
  code: string;
  file: string;
  language: string;
  path?: string;
}
export interface CodeEditAndViewProps extends HouseKeys {
  code?: string;
  file?: string;
  language?: string;
  initialMode?: "view" | "edit";
  showLineNumbers?: boolean;
  showMinimap?: boolean;
  startLine?: number;
  tabSize?: number;
  disabled?: boolean;
  className?: string;
  container_class?: string;
  children?: ReactNode;
  handleChange?: HandlerKey<{ code: string }, "code-change", void>;
  handleValidate?: HandlerKey<
    CodeFile,
    "validate-code",
    Promise<CodeDiagnostic[]> | CodeDiagnostic[]
  >;
  handleSave?: HandlerKey<CodeFile, "save-code", Promise<void> | void>;
}
