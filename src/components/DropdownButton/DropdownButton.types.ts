import type { MouseEvent, ReactNode } from "react";
import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";

export interface DropdownButtonProps extends Omit<HouseKeys, "title"> {
  title?: ReactNode;
  label?: ReactNode;
  Icon?: ReactNode;
  children?: ReactNode;
  is_open?: boolean;
  is_closed?: boolean;
  disabled?: boolean;
  button_class?: string;
  dropdown_class?: string;
  className?: string;
  handleClick?: HandlerKey<MouseEvent<HTMLButtonElement>, "drop-down-button", void, DropdownButtonProps>;
}
