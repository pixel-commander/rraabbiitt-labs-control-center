import type { CSSProperties } from "react";
import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";

export interface StatusBarProps extends HouseKeys {
  status?: string;
  /** Milliseconds before showing the status. */
  delay?: number;
  /** Milliseconds visible when is_open is false. Zero disables the timer. */
  duration?: number;
  /** Keep the status open until manually closed. */
  is_open?: boolean;
  color?: CSSProperties["color"];
  className?: string;
  handleClick?: HandlerKey<string, "close", void>;
}
