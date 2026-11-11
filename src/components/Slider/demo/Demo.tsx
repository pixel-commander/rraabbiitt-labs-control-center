import { useState } from "react";
import { Slider } from "../Slider";
export const Demo = () => {
  const [value, setValue] = useState(62);
  return (
    <div
      data-cols="1"
      style={{ alignContent: "start", gap: "1.5rem", padding: "1rem" }}
    >
      <Slider
        label="REACTOR OUTPUT"
        value={value}
        handleChange={(value) => {
          if (value !== undefined) setValue(value);
        }}
      />
      <Slider
        label="THRESHOLD AT 80"
        value={value}
        threshold={80}
        handleChange={(value) => {
          if (value !== undefined) setValue(value);
        }}
      />
      <Slider label="DISABLED" value={30} is_disabled />
    </div>
  );
};
