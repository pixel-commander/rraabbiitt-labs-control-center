import type { ReactNode } from "react";
import type { HouseKeys } from "../../HouseKeys.types";

export interface StatelesssFormProps extends HouseKeys {
  children?: ReactNode;
  className?: string;
}
