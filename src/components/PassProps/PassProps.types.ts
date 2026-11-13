import type { ReactNode } from "react";
import type { HouseKeys } from "../../HouseKeys.types";

export interface PassPropsProps extends HouseKeys {
  [key: string]: unknown;
  children?: ReactNode;
  className?: string;
}
