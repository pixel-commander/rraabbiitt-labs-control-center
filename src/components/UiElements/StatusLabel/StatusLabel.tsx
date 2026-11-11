import type { StatusLabelProps } from "./StatusLabel.types";
import "./css/status-label.css";
export const StatusLabel = (props: StatusLabelProps) => {
  const {
    status = "success",
    status_color,
    label_color,
    label,
    className = "",
  } = props;
  return (
    <div
      className={[
        "status-label",
        !status_color ? `status-${status}` : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className="status-label-dot"
        aria-hidden="true"
        style={status_color === undefined ? undefined : { color: status_color }}
      >
        ●
      </span>
      <span
        className="status-label-label"
        style={label_color === undefined ? undefined : { color: label_color }}
      >
        {label}
      </span>
    </div>
  );
};
