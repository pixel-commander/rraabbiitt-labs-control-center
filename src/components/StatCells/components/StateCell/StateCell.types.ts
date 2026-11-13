import type { ReactNode } from "react";
import type { HouseKeys } from "../../../../HouseKeys.types";

export interface StateCellProps extends Omit<HouseKeys, "title"> {
  title?: ReactNode;
  value: ReactNode;
  label?: ReactNode;
  cell_class?: string;
  className?: string;
}
