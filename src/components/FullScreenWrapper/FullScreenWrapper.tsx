import type { FullScreenWrapperProps } from "./FullScreenWrapper.types";
import "./css/full-screen-wrapper.css";
export const FullScreenWrapper = (props: FullScreenWrapperProps) => {
  const {
    children = null,
    className = "",
    container_class = "container-main",
    full = false,
    title,
    heading,
    actions,
    icon,
    handleChange,
  } = props;
  return (
    <section
      className={[
        "full-screen-wrapper",
        container_class,
        full ? "is-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-grid="header-main"
      onKeyDown={(event) => {
        if (event.key === "Escape" && full && !event.defaultPrevented) {
          event.stopPropagation();
          handleChange?.({ full: false }, "fullscreen", { ...props });
        }
      }}
    >
      <header data-area="header" data-grid="side-right" className="pad">
        <div data-area="main">
          <div>{heading ?? title}</div>
        </div>
        <div data-area="side">
          <div>
            {actions}
            <button
              type="button"
              className="action-main pad"
              aria-label={full ? "Exit fullscreen" : "Enter fullscreen"}
              aria-pressed={full}
              onClick={() =>
                handleChange?.({ full: !full }, "fullscreen", { ...props })
              }
            >
              {icon ?? (full ? "Restore" : "Fullscreen")}
            </button>
          </div>
        </div>
      </header>
      <div data-area="main" className="full-screen-wrapper__body">
        <div className="scroll-y pad">{children}</div>
      </div>
    </section>
  );
};
