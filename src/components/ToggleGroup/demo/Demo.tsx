import { useState } from "react";
import { ToggleGroup } from "../ToggleGroup";

const items = [
  { id: 1, path: "auto", label: "Auto" },
  { id: 2, path: "dark", label: "Dark" },
  { id: 3, path: "light", label: "Light" },
];

export const Demo = () => {
  const [selected, setSelected] = useState("auto");

  return (
    <div className="demo container-demos">
      <ToggleGroup
        title="Canvas background"
        items={items}
        selected={selected}
        handleClick={(item) => { if (item) setSelected(item.path); }}
      />
    </div>
  );
};
