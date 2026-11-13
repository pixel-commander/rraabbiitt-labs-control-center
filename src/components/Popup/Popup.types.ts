import type { ReactNode } from "react";
import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";
import type { WindowRect } from "../../hooks/useWindowGesture/useWindowGesture";
export type PopupMode = "docked" | "floating" | "fullscreen";
export interface PopupValue {
  mode: PopupMode;
  rect: WindowRect;
}
export interface PopupProps extends HouseKeys {
  value: PopupValue;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
  canDrag?: boolean;
  canResize?: boolean;
  canFullscreen?: boolean;
  handleChange?: HandlerKey<
    PopupValue,
    "move" | "resize" | "snap" | "fullscreen" | "restore",
    void
  >;
}
