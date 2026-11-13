import type { ReactNode } from "react";
import type { HandlerKey, PathsProps } from "../../HouseKeys.types";
import type {
  CodeEditAndViewProps,
  CodeFile,
} from "../CodeEditAndView/CodeEditAndView.types";
import type { FloatWindowProps } from "../FloatWindow/FloatWindow.types";

export interface CodeViewPopupLinkProps extends Omit<
  CodeEditAndViewProps,
  "handleSave" | "handleChange" | "handleValidate"
> {
  handleChange?: HandlerKey<
    { code: string },
    "code-change",
    void,
    CodeViewPopupLinkProps
  >;
  handleValidate?: HandlerKey<
    CodeFile,
    "validate-code",
    ReturnType<NonNullable<CodeEditAndViewProps["handleValidate"]>>,
    CodeViewPopupLinkProps
  >;
  Icon?: ReactNode;
  type?: string;
  open?: boolean;
  showLink?: boolean;
  rect?: FloatWindowProps["rect"];
  window_class?: string;
  handleLoad?: HandlerKey<
    PathsProps,
    "load-code",
    Promise<string> | string,
    CodeViewPopupLinkProps
  >;
  handleSave?: HandlerKey<
    CodeFile,
    "save-code",
    Promise<void> | void,
    CodeViewPopupLinkProps
  >;
  handleClick?: HandlerKey<PathsProps, "open", void, CodeViewPopupLinkProps>;
  handleCancel?: HandlerKey<undefined, "close", void, CodeViewPopupLinkProps>;
}
