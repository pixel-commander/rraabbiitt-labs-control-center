import type { IconButtonProps } from "../IconButton/IconButton.types";
export interface StatusIconProps extends Omit<IconButtonProps, "action_atom"> {
  title: string;
  status?: "primary" | "success" | "warning" | "error";
  busy?: boolean;
}
