Calendar
========

Presentational calendar with month, multi-week and day views, date navigation, event selection and add-event callbacks. The caller owns selected date and view.

Implementation: Calendar.tsx
Exports: Calendar

Render this component with the props below. Application data and persistence remain with the caller.

Customization
-------------
UI classes can be overridden via theme tokens, component tokens, supplied className/container_class/cell_class/event_class props where exposed, or CSS in a parent/external stylesheet. Use only the class props declared by this implementation. The component base class stays in place. An omitted container_class uses the implementation default; an empty string deliberately removes that default. Parent CSS can target the component base class and its documented child classes. Put stylesheet overrides after defaults or in the overrides layer. Tokens must be applied to the component element when it defines its own defaults. Plain functions do not render containers; style the elements supplied to them.

Sizing
------
The caller supplies available layout space. Scroll regions require a bounded grid track and min-block-size: 0. Preview-only dimensions belong in demo files, not reusable component defaults.

Public types
------------
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


Usage skill
-----------
schema: 1
intent: use
owner:
  id: 1793976288008
  path: C:/rraabbiitt-react-components/src/components/Calendar
  file: rab.settings.json
id: 1794000796693
name: use Calendar
title: Use Calendar
description:
  Presentational calendar with month, multi-week and day views, date navigation, event
  selection and add-event callbacks. The caller owns selected date and view.
type: function
path: C:\rraabbiitt-react-components\src\components\Calendar
file: use.skill.yaml
tags: []
implementation:
  - path: C:/rraabbiitt-react-components/src/components/Calendar
    file: Calendar.tsx
context: []
inputs: {}
outputs: {}
instructions: >-
  Render Calendar with events using HouseKeys plus color. Event date is a numeric timestamp;
  title or name supplies display text. Parent owns value and view.
  handleSelect(data, type, props) reports calendar-event with the complete event,
  calendar-date with the selected timestamp, calendar-previous/calendar-next with the target
  timestamp, and calendar-view with day, week or month.
  handleClick(timestamp, "calendar-add-event", props) is reserved for the add-event button.
  has_views controls view buttons. Calendar fills its container; fixed preview heights belong
  in the demo. Calendar styles live in css/calendar.css.

render({ event, date }, "event") customizes event content only. Calendar owns date cells, scrolling, and date selection.
