import type { CSSProperties, ReactNode, ReactElement } from "react";
import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";

export type CalendarView = "day" | "week" | "month";
export interface CalendarEvent extends HouseKeys {
  color?: CSSProperties["color"];
  Icon?: ReactNode;
}
export interface CalendarProps extends HouseKeys {
  events?: CalendarEvent[];
  value?: string | number;
  selected?: number | CalendarEvent;
  view?: CalendarView;
  size?: "small" | "full";
  has_views?: CalendarView[];
  color?: CSSProperties["color"];
  className?: string;
  container_class?: string;
  cell_class?: string;
  event_class?: string;
  is_visible?: boolean;
  render?: (
    data: { event: CalendarEvent; date: number },
    type: "event",
  ) => ReactElement;
  handleSelect?: HandlerKey<
    CalendarEvent | number | CalendarView,
    | "calendar-event"
    | "calendar-date"
    | "calendar-previous"
    | "calendar-next"
    | "calendar-view",
    void
  >;
  handleClick?: HandlerKey<number, "calendar-add-event", void>;
}
