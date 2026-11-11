import type { HouseKeys } from "../../../ui/HouseKeys.types";
import type { ReactNode, RefObject } from "react";

export type SmartTooltipPlacement =
  "above" | "below" | "left" | "right" | "before" | "after";
export interface SmartTooltipPosition {
  x: number;
  y: number;
}

export interface SmartTooltipProps extends Omit<HouseKeys, "title"> {
  /** Element whose bounds activate the tooltip. */
  targetRef: RefObject<Element | null>;
  /** Controlled tooltip body; update it with the caller's React state. */
  content?: ReactNode;
  /** Optional heading rendered above the tooltip body. */
  title?: ReactNode;
  /** Composable tooltip body, including formatted markup or other components. */
  children?: ReactNode;
  /** Preferred side of the pointer; flips when the viewport has no room. */
  placement?: SmartTooltipPlacement;
  /** When true, unmounts the portal and its pointer/viewport listeners. */
  disabled?: boolean;
  /** Optional live anchor position used by ChartTooltip's snap_to_point mode. */
  positionRef?: RefObject<SmartTooltipPosition | null>;
  className?: string;
  container_class?: string;
}
