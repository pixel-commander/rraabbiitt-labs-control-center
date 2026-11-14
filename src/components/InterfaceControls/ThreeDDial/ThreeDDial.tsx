import type { CSSProperties } from "react";
import type { ThreeDDialProps } from "./ThreeDDial.types";
import { useThreeDDial } from "./hooks/useThreeDDial";
import "../css/interface-controls.css";
import "./css/three-d-dial.css";
export const ThreeDDial = (props: ThreeDDialProps) => {
  const { label = "Tone", dark = false, disabled = false, size = "1em", className = "" } = props;
  const { value, knobRef, pointerDown, pointerMove, pointerUp, keyDown } = useThreeDDial(props);
  return (
    <div className={`three-d-dial unit ${className}`} style={{ fontSize: size }}>
      <div className="dial">
        <div className="dial__marks" aria-hidden="true">
          {Array.from({ length: 21 }, (_, i) => <span key={i} style={{ transform: `rotate(${-135 + i * 13.5}deg)` }} data-on={i <= Math.round(value / 5)} />)}
        </div>
        <div ref={knobRef} className={`knob${dark ? " knob--dark" : ""}`} role="slider" tabIndex={disabled ? -1 : 0}
          aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)} aria-disabled={disabled}
          style={{ "--angle": `${-135 + value * 2.7}deg` } as CSSProperties}
          onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}
          onLostPointerCapture={pointerUp} onKeyDown={keyDown}>
          <div className="knob__cap" />
          <div className="knob__pointer"><span className="knob__tick" /></div>
        </div>
      </div>
      <span className="readout">{Math.round(value)}</span><span className="stamp">{label}</span>
    </div>
  );
};
