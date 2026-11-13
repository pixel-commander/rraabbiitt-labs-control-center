import type { CodeViewPopupLinkProps } from "../../CodeViewPopupLink/CodeViewPopupLink.types";

export interface WorldCodeViewPopupLinkProps extends Omit<CodeViewPopupLinkProps, "handleLoad" | "handleSave"> {
  /** Full source-file path, relative to the project root or absolute within src. */
  src_path?: string;
}
