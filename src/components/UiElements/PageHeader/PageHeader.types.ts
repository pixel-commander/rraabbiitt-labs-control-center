import type { ReactNode } from "react";
import type { HouseKeys } from "../../../HouseKeys.types";
export interface PageHeaderProps extends HouseKeys {
  label?: ReactNode;
  Headline?: ReactNode;
  Right?: ReactNode;
  className?: string;
}
