import type { HouseKeys } from "../../HouseKeys.types";
import type { ReactNode } from "react";
export interface ShellProps extends HouseKeys {
  header?: ReactNode;
  children?: ReactNode;
  className?: string;
}
