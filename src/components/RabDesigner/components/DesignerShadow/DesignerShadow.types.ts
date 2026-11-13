import type { HouseKeys, HandlerKey } from "../../../../HouseKeys.types";

export interface DesignerShadowProps extends HouseKeys {
  title: string;
  value: string;
  theme?: Record<string, string>;
  handleChange: HandlerKey<string, "change", void>;
  className?: string;
}
