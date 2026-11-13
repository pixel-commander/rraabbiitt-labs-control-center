import type { ReactNode } from "react";
import type { HouseKeys } from "../../HouseKeys.types";
export interface ToggleSectionProps extends Omit<HouseKeys, "title"> {
  title?: ReactNode;
  title_class?: string;
  container_class?: string;
  children?: ReactNode;
  className?: string;
}
