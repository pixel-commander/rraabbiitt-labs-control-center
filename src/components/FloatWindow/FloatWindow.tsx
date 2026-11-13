import { useRef } from "react";
import type { FloatWindowProps } from "./FloatWindow.types";
import { useWindowGesture } from "../../hooks/useWindowGesture/useWindowGesture";
import "./css/float-window.css";
import "../../atoms/containers/container-dropdown/container-dropdown.css";
export const FloatWindow = (props: FloatWindowProps) => {
  const {
    rect,
    title = "Preview",
    children,
    className = "",
    container_class = "container-dropdown",
    header_class = "container-neg",
    open = true,
    canDrag = true,
    canResize = true,
    actions,
    handleChange,
    handleClose,
  } = props;

  const root = useRef<HTMLDivElement>(null);
  const { begin } = useWindowGesture(root, {
    rect,
    handleChange: (value, type) => handleChange?.(value, type, props),
  });
  if (!open) return null;
  return (
    <div
      ref={root}
      className={["float-window", "effect-float", container_class, className]
        .filter(Boolean)
        .join(" ")}
      data-grid="header-main"
      role="region"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
      }}
    >
      <header
        data-area="header"
        data-grid="side-right"
        className={[header_class, "float-window-header", header_class].filter(Boolean).join(" ")}
        onPointerDown={canDrag ? (event) => begin(event, "move") : undefined}
      >
      
          <div className="pad" data-area="main">{title}</div>
         
       
          <div className="actions-col" data-area="side">
            {actions}
            <button
              type="button"
              className="float-window-close"
              aria-label="Close window"
              onClick={() => handleClose?.(undefined, "close", props)}
            >
              &times;
            </button>
          </div>
       
      </header>
      <div data-area="main" className="float-window__body">
        <div className="scroll-y pad">{children}</div>
      </div>
      {canResize && (
        <div
          className="float-window__resize"
          aria-hidden="true"
          onPointerDown={(event) => begin(event, "resize")}
        />
      )}
    </div>
  );
};
