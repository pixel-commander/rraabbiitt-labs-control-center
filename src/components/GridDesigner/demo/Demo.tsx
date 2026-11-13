import { useState } from "react";
import { GridDesigner } from "../GridDesigner";
import type { GridState } from "../GridDesigner.types";
import "./demo.css";
const initial: GridState = {
  rows: 6,
  cols: 6,
  rowTracks: Array.from({ length: 6 }, () => ({ mode: "1fr", manual: "1fr" })),
  colTracks: Array.from({ length: 6 }, () => ({ mode: "1fr", manual: "1fr" })),
  boxes: [
    { id: 1, area: "header", r1: 1, c1: 1, r2: 1, c2: 6 },
    { id: 2, area: "main", r1: 2, c1: 2, r2: 5, c2: 5 },
  ],
};
export const Demo = () => {
  const [data, setData] = useState(initial),
    [selected, setSelected] = useState<number>(),
    [saved, setSaved] = useState(""),
    [disabled, setDisabled] = useState(false);
  return (
    <div data-cols="1" className="grid-designer-demo">
      <div>
        <label>
          <input
            type="checkbox"
            checked={disabled}
            onChange={(e) => setDisabled(e.target.checked)}
          />{" "}
          Disabled
        </label>{" "}
        <button
          type="button"
          className="action-main"
          onClick={() => {
            setData(initial);
            setSelected(undefined);
          }}
        >
          Reset demo
        </button>
        <p>
          Drag empty cells to draw. Drag a box to move; drag its corner to
          resize. Selected: {selected ?? "none"}
        </p>
      </div>
      <div className="grid-designer-demo__preview" data-rows="1">
        <GridDesigner
          data={data}
          selected={selected}
          disabled={disabled}
          handleChange={(next) => {
            if (next) setData(next);
          }}
          handleSelect={(id) => setSelected(id)}
          handleSave={(value) => setSaved(value?.css ?? "")}
        />
      </div>
      <p>Demo save previews CSS below; it does not write to disk.</p>
      {saved && <pre>{saved}</pre>}
    </div>
  );
};
