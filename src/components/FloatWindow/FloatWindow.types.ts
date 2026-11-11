import type { ReactNode } from "react";
import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";
import type { WindowRect } from "../../hooks/useWindowGesture/useWindowGesture";
export interface FloatWindowProps extends Omit<HouseKeys, "title"> {
  /** Content displayed as the window title in the header. Defaults to "Preview". */
  title?: ReactNode;
  /** Content rendered inside the window's scrollable body. */
  children?: ReactNode;
  /** Extra CSS classes appended to the outer window element. */
  className?: string;
  /** Skin classes applied to the outer window. Defaults to "container-main", while an empty string removes that default. */
  container_class?: string;
  /** Extra CSS classes applied to the draggable header alongside its structural class. */
  header_class?: string;
  /** Position and size in pixels within the positioned parent. The caller updates this value in response to move and resize requests. */
  rect: WindowRect;
  /** Whether the window is rendered. Defaults to true. */
  open?: boolean;
  /** Allows dragging the window by its header. Defaults to true. */
  canDrag?: boolean;
  /** Shows the bottom corner handle and allows resizing. Defaults to true. */
  canResize?: boolean;
  /** Custom header content, such as action buttons, placed before the close button. */
  actions?: ReactNode;
  /** Requests a new rectangle during a move or resize gesture. Receives the rectangle, action type, and incoming props bag. */
  handleChange?: HandlerKey<
    WindowRect,
    "move" | "resize",
    void,
    FloatWindowProps
  >;
  /** Requests closing when the close button is clicked. The caller owns visibility and should update open. */
  handleClose?: HandlerKey<undefined, "close", void, FloatWindowProps>;
}
