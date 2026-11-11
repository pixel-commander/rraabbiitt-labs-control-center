import type { ReactNode } from "react";
import type { HouseKeys } from "../../../HouseKeys.types";

export interface ToolColProps extends HouseKeys {
  children?: ReactNode;
  className?: string;
  is_open?: boolean;
}
