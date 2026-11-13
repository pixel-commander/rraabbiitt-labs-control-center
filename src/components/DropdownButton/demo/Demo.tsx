import { useState } from "react";
import { DropdownButton } from "../DropdownButton";

export const Demo = () => {
  const [selection, setSelection] = useState("Choose an option");
  return (
    <div className="demo container-demos">
      <DropdownButton label={selection}>
        <div data-cols="1" data-gap="control">
          {["First", "Second"].map((label) => (
            <button key={label} type="button" className="action-light" onClick={() => setSelection(label)}>
              {label}
            </button>
          ))}
        </div>
      </DropdownButton>
      <p role="status">Selected: {selection}</p>
      <DropdownButton label="Custom content">
        <p>Caller-provided content</p>
      </DropdownButton>
    </div>
  );
};