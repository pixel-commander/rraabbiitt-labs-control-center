import type { ReactNode } from "react";
import type { HouseKeys } from "../../HouseKeys.types";
export interface GridCellProps extends HouseKeys {
  styler?: "main" | "alt" | "inset" | "float" | "metal";
  children?: ReactNode;
  className?: string;
  data_area?: string;
  container_class?: string;
  cell_class?: string;
  scroll?: "x" | "y" | "both";
  padding?: "sm" | "md" | "lg" | (string & {});
}
