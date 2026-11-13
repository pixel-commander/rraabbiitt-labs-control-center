import type { ReactNode } from "react";
import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";

export interface ModalProps extends Omit<HouseKeys, "title"> {
  children?: ReactNode;
  className?: string;
  open?: boolean;
  title?: ReactNode;
  footer?: ReactNode;
  closeOnBackdrop?: boolean;
  handleClick?: HandlerKey<{}, "close-modal", void, ModalProps>;
}
