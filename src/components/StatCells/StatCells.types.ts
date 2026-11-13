import type { HouseKeys } from "../../HouseKeys.types";
import type { StateCellProps } from "./components/StateCell/StateCell.types";

export interface StatCellsProps extends HouseKeys {
  cells?: readonly StateCellProps[];
  mode?: "main" | "alt";
  size?: "sm" | "md" | "lg";
  pad?: "none" | "sm" | "md" | "lg";
  container_class?: string;
  className?: string;
}
