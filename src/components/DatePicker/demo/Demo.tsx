import { useState } from "react";
import type { DatePickerSelection } from "../DatePicker.types";
import { DatePicker } from "../DatePicker";
export const Demo = () => {
  const [selected, setSelected] = useState<DatePickerSelection>([
    new Date(2026, 7, 11).getTime(),
    new Date(2026, 7, 11).getTime(),
  ]);
  return (
    <div style={{ padding: "1rem", maxWidth: "26rem" }}>
      <DatePicker
        selected={selected}
        handleSelect={(date) => {
          if (date !== undefined) setSelected(date);
        }}
      />
      <p>Selected range: {JSON.stringify(selected)}</p>
    </div>
  );
};
