import type { ThreeDToggleButtonsProps } from "./ThreeDToggleButtons.types";
import "../css/interface-controls.css";
import "./css/three-d-toggle-buttons.css";
export const ThreeDToggleButtons = (props: ThreeDToggleButtonsProps) => {
  const { label = "Output mode", value = "mono", options = [{ name: "mono", label: "mono" }, { name: "stereo", label: "stereo" }],
    disabled = false, size = "1em", className = "", handleClick } = props;
  return (
    <div className={`three-d-toggle-buttons unit ${className}`} style={{ fontSize: size }}>
      <div className="selector" role="group" aria-label={label}>
        {options.map(option => <button type="button" className="pad" key={option.name} disabled={disabled} aria-label={option.label}
          aria-pressed={value === option.name} onClick={() => handleClick?.({ value: option.name }, "toggle-buttons", props)}>
          <span className="pad__lamp" />
        </button>)}
      </div>
      <div className="selector-labels engraved" aria-hidden="true">{options.map(option => <span key={option.name}>{option.label}</span>)}</div>
    </div>
  );
};
