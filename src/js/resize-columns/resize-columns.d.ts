import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";
export interface ResizeColumnsResult {
  side: "left" | "right";
  width: number;
}
export interface ResizeColumnsProps extends HouseKeys {
  grip_selector?: string;
  min_rem?: number;
  max_rem?: number;
  handleChange?: HandlerKey<ResizeColumnsResult, "resize-columns", void>;
}
export const defaultProps: Readonly<{
  grip_selector: string;
  min_rem: number;
  max_rem: number;
}>;
export const resizeColumns: (
  ref: HTMLElement | { current: HTMLElement | null } | null,
  props?: ResizeColumnsProps,
) => () => void;
export default resizeColumns;
