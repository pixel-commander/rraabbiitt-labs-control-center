import type { ThreeDPressButtonProps } from "./ThreeDPressButton.types";
import "../css/interface-controls.css";
import "../ThreeDToggleButtons/css/three-d-toggle-buttons.css";
import "./css/three-d-press-button.css";
export const ThreeDPressButton = (props: ThreeDPressButtonProps) => {
  const { label = "Phase", pressed = false, stadium = false, disabled = false, size = "1em", className = "", handleClick } = props;
  return (
    <div className={`three-d-press-button unit ${className}`} style={{ fontSize: size }}>
      <span className="led" data-on={pressed} aria-hidden="true" />
      <button type="button" disabled={disabled} className={["pb", stadium && "pb--stadium", pressed && "pb--lit"].filter(Boolean).join(" ")}
        aria-label={label} aria-pressed={pressed} onClick={() => handleClick?.({ pressed: !pressed }, "press-button", props)}>
        <span className="pb__cap">
          <span className="pad__lamp" aria-hidden="true" />
        </span>
      </button>
      <span className="stamp">{label}</span>
    </div>
  );
};
