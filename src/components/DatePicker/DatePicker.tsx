import { useId, useRef } from "react";
import type { DatePickerProps } from "./DatePicker.types";
import { useDatePicker } from "./hooks/useDatePicker/useDatePicker";
import "./css/date-picker.css";
const keyOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const DatePicker = (props: DatePickerProps) => {
  const {
    label = "DATE",
    className = "",
    is_disabled = false,
    is_visible = true,
  } = props;
  const {
    open,
    view,
    selected,
    range,
    toggle,
    step,
    pick,
    begin,
    move,
    finish,
    cancel,
  } = useDatePicker(props);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  if (!is_visible) return null;
  const offset = (view.getDay() + 6) % 7;
  const cells = Array.from(
    { length: 42 },
    (_, i) => new Date(view.getFullYear(), view.getMonth(), 1 - offset + i),
  );
  return (
    <div
      className={["date-picker", "date-picker-main", className]
        .filter(Boolean)
        .join(" ")}
      onBlur={(event) => {
        if (
          !event.currentTarget.contains(event.relatedTarget as Node | null) &&
          open
        )
          toggle(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          toggle(false);
          trigger.current?.focus();
        }
      }}
    >
      <label htmlFor={id}>{label}</label>
      <button
        ref={trigger}
        id={id}
        type="button"
        className={["date-picker-face", props.select_class]
          .filter(Boolean)
          .join(" ")}
        data-grid="side-right"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        disabled={is_disabled}
        onClick={() => toggle(!open)}
      >
        <span data-area="main">
          {range
            ? `${keyOf(new Date(range[0]))} – ${keyOf(new Date(range[1]))}`
            : selected
              ? keyOf(selected)
              : "Pick a date"}
        </span>
        <span data-area="side" aria-hidden="true">
          {open ? "▴" : "▾"}
        </span>
      </button>
      {props.description && <p>{props.description}</p>}
      {open && (
        <div
          id={`${id}-panel`}
          className={["date-picker-popover", props.dropdown_class]
            .filter(Boolean)
            .join(" ")}
          aria-label={label || "Choose date"}
        >
          <div className="date-picker-month" data-grid="sides">
            <button
              type="button"
              data-area="left"
              className="date-picker-step"
              aria-label="Previous month"
              disabled={is_disabled}
              onClick={() => step(-1)}
            >
              ‹
            </button>
            <span
              data-area="main"
              className="date-picker-title"
              aria-live="polite"
            >
              {view.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
            <button
              type="button"
              data-area="right"
              className="date-picker-step"
              aria-label="Next month"
              disabled={is_disabled}
              onClick={() => step(1)}
            >
              ›
            </button>
          </div>
          <div className="date-picker-dow" data-cols="7" aria-hidden="true">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
              <span key={i}>{day}</span>
            ))}
          </div>
          <div
            className="date-picker-days"
            data-cols="7"
            onPointerDown={begin}
            onPointerMove={move}
            onPointerUp={(event) => {
              if (finish(event)) trigger.current?.focus();
            }}
            onPointerCancel={cancel}
            onLostPointerCapture={cancel}
          >
            {cells.map((date) => {
              const key = keyOf(date);
              const active = range
                ? date.getTime() >= range[0] && date.getTime() <= range[1]
                : selected !== undefined && key === keyOf(selected);
              return (
                <button
                  key={key}
                  data-date={date.getTime()}
                  type="button"
                  className={[
                    "date-picker-day",
                    props.cell_class,
                    date.getMonth() !== view.getMonth() ? "outside" : "",
                    active ? "is-selected" : "",
                    key === keyOf(new Date()) ? "is-active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-label={date.toDateString()}
                  aria-pressed={active}
                  aria-current={key === keyOf(new Date()) ? "date" : undefined}
                  disabled={is_disabled}
                  onClick={(event) => {
                    if (event.detail !== 0) return;
                    pick([date.getTime(), date.getTime()]);
                    trigger.current?.focus();
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
