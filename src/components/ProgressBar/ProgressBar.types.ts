import type { ReactNode } from "react";
import type { HouseKeys } from "../../HouseKeys.types";
export interface ProgressBarProps extends HouseKeys {
  children?: ReactNode;
  className?: string;
  value?: number;
  scale?: "auto" | "fraction" | "percent";
  label?: boolean | string;
}
