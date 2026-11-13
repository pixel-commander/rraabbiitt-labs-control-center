import type { DropdownButtonProps } from "../../DropdownButton/DropdownButton.types";
export type RefreshStatus = "idle" | "refreshing" | "success" | "warning" | "error";
export interface RefreshSystemButtonProps extends Omit<DropdownButtonProps, "title" | "label"> {
  status?: RefreshStatus;
  message?: string;
}
