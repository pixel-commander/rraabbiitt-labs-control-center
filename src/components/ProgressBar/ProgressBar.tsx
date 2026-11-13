import type { ProgressBarProps } from "./ProgressBar.types";
import "./css/progress-bar.css";
export const ProgressBar = (props: ProgressBarProps) => {
  const {
    value = 0,
    scale = "auto",
    label = false,
    className = "",
    title,
    name,
    children,
  } = props;
  const finite = Number.isFinite(value) ? value : 0;
  const raw =
    scale === "fraction" || (scale === "auto" && finite <= 1)
      ? finite * 100
      : finite;
  const percent = Math.max(0, Math.min(100, raw));
  const text =
    label === true
      ? `${Math.round(percent)}% complete`
      : typeof label === "string"
        ? label
        : null;
  return (
    <div className={["progress-bar", className].filter(Boolean).join(" ")}>
      <div
        className="progress-bar__track progress-track"
        role="progressbar"
        aria-label={title ?? name ?? "Progress"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className="progress-bar__fill progress-fill"
          style={{ inlineSize: `${percent}%` }}
        />
      </div>
      {text !== null && <div className="progress-bar__label">{text}</div>}
      {children}
    </div>
  );
};
