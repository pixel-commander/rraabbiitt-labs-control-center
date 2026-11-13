import type { StatusBarProps } from "./StatusBar.types";
import { useStatusBar } from "./hooks/useStatusBar/useStatusBar";
import "./css/status-bar.css";

export const StatusBar = (props: StatusBarProps) => {
  const { status = "", className = "", color } = props;
  const { ref, close } = useStatusBar(props);
  return (
    <div
      ref={ref}
      className={["status-bar", className].filter(Boolean).join(" ")}
      style={{ color }}
    >
      <div className="status-bar__message" data-grid="side-right">
        <div data-area="main" role="status">
          {status}
        </div>
        <div data-area="side">
          <button
            type="button"
            className="action-main"
            aria-label="Close status"
            onClick={close}
          >
            ï¿½
          </button>
        </div>
      </div>
    </div>
  );
};
