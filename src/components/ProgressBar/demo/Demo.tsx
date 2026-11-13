import { useState } from "react";
import { ProgressBar } from "../ProgressBar";
export const Demo = () => {
  const [value, setValue] = useState(62);
  return (
    <div>
      <label>
        Progress{" "}
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
        />
      </label>
      <ProgressBar
        value={value}
        scale="percent"
        label
        title="Interactive progress"
      />
      <h3>Fraction</h3>
      <ProgressBar value={0.35} label />
      <h3>Custom label</h3>
      <ProgressBar value={78} label="78 of 100 files processed" />
      <h3>Empty / complete</h3>
      <ProgressBar value={0} label />
      <ProgressBar value={100} label />
    </div>
  );
};
