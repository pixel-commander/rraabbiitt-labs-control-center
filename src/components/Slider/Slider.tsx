import { useId } from "react";
import type { CSSProperties } from "react";
import type { SliderProps } from "./Slider.types";
import "./css/slider.css";
export const Slider = (props: SliderProps) => {
  const inputId = useId();
  const {
    min = 0,
    max = 100,
    step = 1,
    threshold,
    value = 0,
    label,
    color,
    slider_class = "slider-main",
    className = "",
    is_disabled = false,
    is_visible = true,
  } = props;
  if (!is_visible) return null;
  const held = Math.min(max, Math.max(min, value));
  const percent = (number: number) =>
    max > min
      ? Math.max(0, Math.min(100, ((number - min) / (max - min)) * 100))
      : 0;
  const over = threshold !== undefined && held >= threshold;
  return (
    <div
      data-grid="sides"
      className={[
        "slider",
        slider_class,
        className,
        over ? "is-over" : "",
        is_disabled ? "is-disabled" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        color === undefined
          ? undefined
          : ({ "--slider-accent": color } as CSSProperties)
      }
    >
      <label data-area="left" className="slider-label" htmlFor={inputId}>
        {label}
      </label>
      <div data-area="main" className="slider-track">
        <span className="slider-rail" aria-hidden="true">
          <span
            className="slider-fill"
            style={{ width: `${percent(held)}%` }}
          />
          {threshold !== undefined && (
            <span
              className="slider-tick"
              style={{ left: `${percent(threshold)}%` }}
            />
          )}
          <span className="slider-knob" style={{ left: `${percent(held)}%` }} />
        </span>
        <input
          id={inputId}
          type="range"
          className="slider-input"
          min={min}
          max={max}
          step={step}
          value={held}
          disabled={is_disabled || max <= min}
          aria-label={label || props.title || props.name || "Slider"}
          onChange={(event) =>
            props.handleChange?.(
              event.currentTarget.valueAsNumber,
              "slider",
              props,
            )
          }
        />
      </div>
      <output data-area="right" className="slider-value" htmlFor={inputId}>
        {held}
      </output>
    </div>
  );
};
