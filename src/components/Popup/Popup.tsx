import { useRef } from "react";
import type { PopupProps } from "./Popup.types";
import { useWindowGesture } from "../../hooks/useWindowGesture/useWindowGesture";
import "./css/popup.css";
export const Popup = (props: PopupProps) => {
  const {
    value,
    title = "Panel",
    children,
    actions,
    className = "",
    canDrag = true,
    canResize = true,
    canFullscreen = true,
    handleChange,
  } = props;
  const root = useRef<HTMLDivElement>(null);
  const seat = useRef<HTMLDivElement>(null);
  const previousMode = useRef<"docked" | "floating">("docked");
  const { mode, rect } = value;
  const report = (
    next: typeof value,
    type: "move" | "resize" | "snap" | "fullscreen" | "restore",
  ) => handleChange?.(next, type, { ...props });
  const { begin } = useWindowGesture(root, {
    rect,
    viewport: true,
    handleChange: (next, type) =>
      report({ mode: "floating", rect: next }, type),
    handleEnd: (next, type) => {
      if (type !== "move") return;
      const bounds = seat.current?.getBoundingClientRect();
      if (
        bounds &&
        next.x < bounds.right &&
        next.x + next.width > bounds.left &&
        next.y < bounds.bottom &&
        next.y + next.height > bounds.top
      )
        report({ mode: "docked", rect: next }, "snap");
    },
  });
  const floating = mode === "floating";
  const fullscreen = mode === "fullscreen";
  return (
    <div className="popup-seat" ref={seat}>
      <div
        className={["popup", "container-main", "popup--" + mode, className]
          .filter(Boolean)
          .join(" ")}
        ref={root}
        data-grid="header-main"
        role="region"
        aria-label={title}
        style={
          floating
            ? {
                left: rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
              }
            : undefined
        }
      >
        <header
          data-area="header"
          data-grid="side-right"
          className="popup__bar container-cell pad"
          onPointerDown={
            canDrag && !fullscreen
              ? (event) => {
                  if ((event.target as HTMLElement).closest("button,input,a"))
                    return;
                  if (mode === "docked") {
                    const bounds = root.current!.getBoundingClientRect();
                    const initial = {
                      x: bounds.left,
                      y: bounds.top,
                      width: bounds.width,
                      height: bounds.height,
                    };
                    begin(event, "move", initial);
                  } else begin(event, "move");
                }
              : undefined
          }
        >
          <div data-area="main">
            <div>{title}</div>
          </div>
          <div data-area="side">
            <div>
              {actions}
              {canFullscreen && (
                <button
                  className="action-main"
                  type="button"
                  aria-pressed={fullscreen}
                  aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                  onClick={() => {
                    if (fullscreen)
                      report(
                        { ...value, mode: previousMode.current },
                        "restore",
                      );
                    else {
                      previousMode.current = mode;
                      report({ ...value, mode: "fullscreen" }, "fullscreen");
                    }
                  }}
                >
                  {fullscreen ? "Restore" : "Fullscreen"}
                </button>
              )}
            </div>
          </div>
        </header>
        <div data-area="main" className="popup__body">
          <div className="scroll-y pad">{children}</div>
        </div>
        {floating && canResize && (
          <div
            aria-hidden="true"
            className="popup__resize"
            onPointerDown={(event) => begin(event, "resize")}
          />
        )}
      </div>
      {floating && (
        <div className="container-inset pad">
          <p>Panel is floating.</p>
          <button
            className="action-main pad"
            type="button"
            onClick={() => report({ ...value, mode: "docked" }, "snap")}
          >
            Snap back
          </button>
        </div>
      )}
    </div>
  );
};
