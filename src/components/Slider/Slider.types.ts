import type { CSSProperties } from "react";
import type { HouseKeys, HandlerKey } from "../../../ui/HouseKeys.types";
export interface SliderProps extends HouseKeys {
  min?: number;
  max?: number;
  step?: number;
  threshold?: number;
  value?: number;
  label?: string;
  color?: CSSProperties["color"];
  slider_class?: string;
  className?: string;
  is_disabled?: boolean;
  is_visible?: boolean;
  handleChange?: HandlerKey<number, "slider", void, SliderProps>;
}
