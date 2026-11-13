import type { ReactNode } from "react";
import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";
export interface FullScreenWrapperProps extends HouseKeys {
  children?: ReactNode;
  className?: string;
  container_class?: string;
  full?: boolean;
  heading?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  handleChange?: HandlerKey<{ full: boolean }, "fullscreen", void>;
}
