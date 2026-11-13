import type { CSSProperties } from "react";
import type { CalendarProps, CalendarEvent } from "./Calendar.types";
import "./css/calendar.css";
import { dragScroll } from "../../js/drag-scroll/drag-scroll.js";

const attachCellScroll = (element: HTMLDivElement | null) => {
  if (element) return dragScroll(element);
};
const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const dateOf = (value: string | number) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
const keyOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const offset = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const mondayOf = (date: Date) => offset(date, -((date.getDay() + 6) % 7));
export const Calendar = (props: CalendarProps) => {
  const {
    events = [],
    value,
    view = "month",
    size = "full",
    has_views = ["week", "month"],
    color,
    className = "",
    is_visible = true,
  } = props;
  if (!is_visible) return null;
  const parsed = value === undefined ? new Date() : dateOf(value);
  const anchor = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const selectedDate =
    typeof props.selected === "number"
      ? keyOf(new Date(props.selected))
      : undefined;
  const selectedEvent =
    typeof props.selected === "object" ? props.selected : undefined;
  const today = keyOf(new Date());
  const small = size === "small";
  const weeks = small ? 2 : 5;
  const first =
    view === "month"
      ? mondayOf(new Date(anchor.getFullYear(), anchor.getMonth(), 1))
      : mondayOf(anchor);
  const byDay = new Map<string, CalendarEvent[]>();
  for (const item of events) {
    if (item.date === undefined) continue;
    const date = dateOf(item.date);
    if (Number.isNaN(date.getTime())) continue;
    const key = keyOf(date);
    byDay.set(key, [...(byDay.get(key) ?? []), item]);
  }
  for (const entries of byDay.values())
    entries.sort((a, b) => +dateOf(a.date!) - +dateOf(b.date!));
  const change = (
    date: Date,
    type:
      "calendar-date" | "calendar-previous" | "calendar-next" = "calendar-date",
  ) => props.handleSelect?.(date.getTime(), type, { ...props });
  const step = (direction: number) => {
    if (view === "month")
      change(
        new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1),
        direction < 0 ? "calendar-previous" : "calendar-next",
      );
    else
      change(
        offset(anchor, direction * (view === "week" ? weeks * 7 : 1)),
        direction < 0 ? "calendar-previous" : "calendar-next",
      );
  };
  const event = (item: CalendarEvent) => {
    const Tag = props.render ? "div" : "button";
    return (
      <Tag
        key={item.id ?? `${item.date}-${item.name}`}
        type={props.render ? undefined : "button"}
        tabIndex={props.render ? 0 : undefined}
        onKeyDown={(e) => {
          if (
            props.render &&
            e.target === e.currentTarget &&
            (e.key === "Enter" || e.key === " ")
          ) {
            e.preventDefault();
            props.handleSelect?.(item, "calendar-event", { ...props });
          }
        }}
        className={[
          "calendar__event",
          props.event_class,
          selectedEvent &&
          (selectedEvent === item ||
            (item.id !== undefined && selectedEvent.id === item.id))
            ? "is-selected"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-pressed={Boolean(
          selectedEvent &&
          (selectedEvent === item ||
            (item.id !== undefined && selectedEvent.id === item.id)),
        )}
        style={
          {
            "--calendar-event-color": item.color ?? "var(--calendar-accent)",
          } as CSSProperties
        }
        onClick={() =>
          props.handleSelect?.(item, "calendar-event", { ...props })
        }
      >
        {props.render ? (
          props.render({ event: item, date: item.date! }, "event")
        ) : (
          <>
            {item.Icon != null && (
              <span className="calendar__event-icon" aria-hidden="true">
                {item.Icon}
              </span>
            )}
            {item.title ?? item.name}
          </>
        )}
      </Tag>
    );
  };
  const cell = (date: Date) => {
    const key = keyOf(date);
    const entries = byDay.get(key) ?? [];
    return (
      <div
        key={key}
        onClick={(event) => {
          if (!(event.target as HTMLElement).closest("button")) change(date);
        }}
        className={[
          "calendar__cell",
          props.cell_class,
          key === today ? "is-today" : "",
          key === selectedDate ? "is-selected" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        data-grid="header-main"
        data-outside={view === "month" && date.getMonth() !== anchor.getMonth()}
      >
        <div data-area="header" data-grid="side-right">
          <button
            type="button"
            data-area="main"
            className="calendar__date"
            data-grid="side-right"
            aria-label={date.toDateString()}
            aria-pressed={key === selectedDate}
            aria-current={key === today ? "date" : undefined}
            onClick={() => change(date)}
          >
            <>
              <span data-area="main">
                {view === "week" ? DAYS[(date.getDay() + 6) % 7] : ""}
              </span>
              <span data-area="side">
                {date.getDate() === 1
                  ? `${date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()} 1`
                  : date.getDate()}
              </span>
            </>
          </button>
          {props.handleClick && (
            <button
              type="button"
              data-area="side"
              className="calendar__add"
              aria-label={`Add event ${key}`}
              onClick={() =>
                props.handleClick?.(date.getTime(), "calendar-add-event", {
                  ...props,
                })
              }
            >
              +
            </button>
          )}
        </div>
        <div data-area="main" className="calendar__events">
          <div ref={attachCellScroll} className="scroll-y">
            {entries.map(event)}
          </div>
        </div>
      </div>
    );
  };
  return (
    <div
      className={[
        "calendar",
        props.container_class ?? "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-grid="header-main"
      style={{ color }}
    >
      <header
        className="calendar__header"
        data-area="header"
        data-grid="side-right"
      >
        <div
          data-area="main"
          className="calendar__date-navigation calendar__views"
          data-grid="sides"
        >
          <button
            type="button"
            data-area="left"
            className="calendar__step"
            aria-label="Previous period"
            onClick={() => step(-1)}
          >
            &lsaquo;
          </button>
          <strong data-area="main">
            {view === "week"
              ? `${first.toLocaleDateString("en-US", { month: "short", day: "numeric" })} \u2013 ${offset(first, weeks * 7 - 1).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : anchor.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                  ...(view === "day" ? { day: "numeric" } : {}),
                })}
          </strong>
          <button
            type="button"
            data-area="right"
            className="calendar__step"
            aria-label="Next period"
            onClick={() => step(1)}
          >
            &rsaquo;
          </button>
        </div>
        {!small && (
          <span
            data-area="side"
            className="calendar__views"
            data-cols={has_views.length}
          >
            {has_views.map((option) => (
              <button
                key={option}
                type="button"
                className="calendar__view"
                aria-pressed={view === option}
                onClick={() =>
                  props.handleSelect?.(option, "calendar-view", { ...props })
                }
              >
                {option}
              </button>
            ))}
          </span>
        )}
      </header>
      <div data-area="main" className="calendar__body">
        {view === "month" ? (
          <div data-grid="header-main" className="calendar__month">
            <div className="calendar__dow" data-area="header" data-cols="7">
              {DAYS.map((day) => (
                <span key={day}>{small ? day[0] : day}</span>
              ))}
            </div>
            <div
              className="calendar__cells"
              data-area="main"
              data-cols="7"
              data-rows="6"
            >
              {Array.from({ length: 42 }, (_, i) => cell(offset(first, i)))}
            </div>
          </div>
        ) : view === "week" ? (
          <div data-cols={weeks} className="calendar__weeks">
            {Array.from({ length: weeks }, (_, i) => (
              <div key={i} className="calendar__week" data-grid="header-main">
                <span className="calendar__week-label" data-area="header">
                  {offset(first, i * 7).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  {"\u2013"}
                  {offset(first, i * 7 + 6).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div
                  className="calendar__week-days"
                  data-area="main"
                  data-rows="7"
                >
                  {Array.from({ length: 7 }, (_, j) =>
                    cell(offset(first, i * 7 + j)),
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="calendar__day">
            {Array.from({ length: 13 }, (_, i) => (
              <div key={i} data-grid="side-left">
                <time data-area="side">
                  {String(i + 7).padStart(2, "0")}:00
                </time>
                <div data-area="main">
                  {(byDay.get(keyOf(anchor)) ?? [])
                    .filter((item) => dateOf(item.date!).getHours() === i + 7)
                    .map(event)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
