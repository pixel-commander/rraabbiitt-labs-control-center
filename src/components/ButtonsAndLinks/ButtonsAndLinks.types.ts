import type { ReactNode } from "react";
import type { HouseKeys } from "../../HouseKeys.types";

export interface ButtonsAndLinksProps extends HouseKeys {
  children?: ReactNode;
  className?: string;
}
