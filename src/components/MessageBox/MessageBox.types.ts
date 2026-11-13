import type { ReactNode } from "react";
import type { HouseKeys, HandlerKey } from "../../../ui/HouseKeys.types";
export interface MessageBoxProps extends HouseKeys {
  place_holder?: string;
  container_class?: string;
  submit_class?: string;
  children?: ReactNode;
  className?: string;
  value?: string;
  handleClick?: HandlerKey<string, "rephrase", void, MessageBoxProps>;
  handleChange?: HandlerKey<string, "message-box", void, MessageBoxProps>;
  handleSubmit: HandlerKey<string, "message-box", void, MessageBoxProps>;
}
