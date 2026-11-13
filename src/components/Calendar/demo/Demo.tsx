import { useState } from "react";
import { Calendar } from "../Calendar";
import type { CalendarView, CalendarEvent } from "../Calendar.types";

export const Demo = () => {
  const [value, setValue] = useState(new Date("2026-08-11T00:00:00").getTime());
  const [selected, setSelected] = useState<number | CalendarEvent>();
  const [view, setView] = useState<CalendarView>("month");
  const [message, setMessage] = useState("");
  return (
    <div>
      <div style={{ height: "35rem" }}>
        <Calendar
          
          value={value}
          selected={selected}
          view={view}
          events={[
            {
              id: 1,
              name: "Glow calibration",
              date: new Date("2026-08-11T10:00:00").getTime(),
              color: "#ff27d5",
            },
            {
              id: 2,
              name: "Layer review",
              date: new Date("2026-08-11T14:00:00").getTime(),
              color: "#44cfff",
            },
            {
              id: 3,
              name: "Ops sync",
              date: new Date("2026-08-12T10:00:00").getTime(),
              color: "#60efaa",
            },
            {
              id: 4,
              name: "Render farm slot",
              date: new Date("2026-08-14T10:00:00").getTime(),
              color: "#ff27d5",
            },
            {
              id: 5,
              name: "Neon channel QA",
              date: new Date("2026-08-18T10:00:00").getTime(),
              color: "#44cfff",
            },
            {
              id: 6,
              name: "Sprint demo",
              date: new Date("2026-08-21T10:00:00").getTime(),
              color: "#ff27d5",
            },
            {
              id: 7,
              name: "Chassis fitting",
              date: new Date("2026-08-25T10:00:00").getTime(),
              color: "#60efaa",
            },
            {
              id: 8,
              name: "Export review",
              date: new Date("2026-08-28T10:00:00").getTime(),
              color: "#ff27d5",
            },
          ]}
          handleSelect={(data, type) => {
            if (typeof data === "number") {
              if (type === "calendar-date") setSelected(data);
              else setValue(data);
            } else if (typeof data === "string" && type === "calendar-view")
              setView(data);
            else if (data && typeof data === "object") setSelected(data);
          }}
          handleClick={(date) => {
            if (date !== undefined)
              setMessage(`Add event: ${new Date(date).toLocaleDateString()}`);
          }}
        />
      </div>
      <p role="status">
        {typeof selected === "number"
          ? `Selected date: ${new Date(selected).toLocaleDateString()}`
          : selected
            ? `Selected event: ${selected.title ?? selected.name ?? ""}`
            : "Select a date cell or event."}
      </p>
      <p>{message}</p>
    </div>
  );
};
