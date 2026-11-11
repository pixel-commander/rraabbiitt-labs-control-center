import type { ReactNode, MouseEvent } from "react";
import type { HouseKeys, HandlerKey } from "../../../HouseKeys.types";
import type { ICON_TYPES } from "./IconButton";

export interface IconButtonProps extends HouseKeys {
  children?: ReactNode;
  Icon?: ReactNode;
  type?: keyof typeof ICON_TYPES;
  disabled?: boolean;
  action_atom?: string;
  handleClick?: HandlerKey<
    MouseEvent<HTMLButtonElement>,
    "icon-button",
    void,
    IconButtonProps
  >;
  className?: string;
}
