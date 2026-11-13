import type { ReactNode } from "react";
import type { HouseKeys } from "../../HouseKeys.types";

export interface TestComponentProps extends HouseKeys {
  children?: ReactNode;
  className?: string;
}
