import { useState } from "react";
import type { HouseKeys, PathsProps } from "../../../HouseKeys.types";
import { SearchableSelect } from "../SearchableSelect";

const data: (HouseKeys & PathsProps)[] = [
  { id: 1, name: "TypeScript", description: "Typed JavaScript" },
  { id: 2, name: "JavaScript", description: "Browser scripting" },
  { id: 3, name: "Markdown", description: "Plain text markup" },
];

export const Demo = () => {
  const [selected, setSelected] = useState<HouseKeys & PathsProps>();
  return (
    <div>
      <SearchableSelect
        data={data}
        selected={selected}
        label="Language"
        placeholder="Choose a language"
        handleClick={(record) => setSelected(record)}
      />
    </div>
  );
};
