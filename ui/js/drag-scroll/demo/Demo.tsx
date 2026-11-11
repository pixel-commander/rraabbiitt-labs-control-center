import { useEffect, useRef, useState } from "react";
import { dragScroll, defaultProps } from "../drag-scroll.js";

export const Demo = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [flick, setFlick] = useState(true);
  const [smooth, setSmooth] = useState(true);
  const [sensitivity, setSensitivity] = useState(defaultProps.sensitivity);
  useEffect(
    () => dragScroll(ref, { flick, smooth, sensitivity }),
    [flick, smooth, sensitivity],
  );
  return (
    <div>
      <p>Drag the cards, then release to flick. Touch uses native scrolling.</p>
      <div>
        <label>
          <input
            type="checkbox"
            checked={flick}
            onChange={(event) => setFlick(event.target.checked)}
          />{" "}
          Flick
        </label>{" "}
        <label>
          <input
            type="checkbox"
            checked={smooth}
            onChange={(event) => setSmooth(event.target.checked)}
          />{" "}
          Smooth
        </label>{" "}
        <label>
          Sensitivity{" "}
          <input
            type="range"
            min="0"
            max="3"
            step="0.25"
            value={sensitivity}
            onChange={(event) => setSensitivity(Number(event.target.value))}
          />{" "}
          {sensitivity}
        </label>{" "}
        <button
          className="action-main pad"
          type="button"
          onClick={() => ref.current?.scrollTo({ left: 0 })}
        >
          Scroll to start
        </button>
      </div>
      <div
        ref={ref}
        className="container-inset"
        style={{ overflow: "auto" }}
        aria-label="Drag-scroll demo"
        tabIndex={0}
      >
        <div style={{ inlineSize: "max-content", whiteSpace: "nowrap" }}>
          {Array.from({ length: 16 }, (_, index) => (
            <div
              key={index}
              className="container-cell pad"
              style={{ display: "inline-block", margin: "var(--space-sm)" }}
            >
              <h3>Card {index + 1}</h3>
              <p>Grab here and drag to explore.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
