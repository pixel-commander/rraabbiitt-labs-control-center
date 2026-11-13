import { useRef, useState } from "react";
import { GridAreaSelect } from "../GridAreaSelect";
import type { GridLayout } from "../GridAreaSelect.types";
const initial: GridLayout = {
  cols: 6,
  rows: 4,
  areas: [
    {
      id: 1,
      name: "Preview",
      r1: 1,
      c1: 1,
      rows: 2,
      cols: 2,
      content: "preview",
    },
    {
      id: 2,
      name: "Details",
      r1: 1,
      c1: 3,
      rows: 2,
      cols: 2,
      content: "details",
    },
  ],
};
export const Demo = () => {
  const [layout, setLayout] = useState(initial),
    [selected, setSelected] = useState<number>(),
    [snap, setSnap] = useState(false);
  const nextId = useRef(3);
  return (
    <div>
      <p>
        Draw in empty cells. Drag an area title to move; drag edges or corners
        to resize. Select and press Delete, or use Ã—.
      </p>
      <div>
        <label>
          <input
            type="checkbox"
            checked={snap}
            onChange={(event) => setSnap(event.target.checked)}
          />{" "}
          Snap neighboring dividers
        </label>{" "}
        <button
          type="button"
          className="action-main pad"
          onClick={() => {
            setLayout(initial);
            setSelected(undefined);
          }}
        >
          Restore layout
        </button>{" "}
        <span
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData("text/x-drop-load-id", "dropped-card");
          }}
          className="container-cell pad"
        >
          Drag this content into an area
        </span>
      </div>
      <div style={{ height: "24rem" }}>
        <GridAreaSelect
          layout={layout}
          selected={selected}
          snap={snap}
          handleClick={(area) => setSelected(area?.id)}
          handleChange={(next) => {
            if (next) setLayout(next);
          }}
          handleCreate={(area) => {
            if (!area) return;
            const id = nextId.current++;
            setLayout((previous) => ({
              ...previous,
              areas: [...previous.areas, { ...area, id, name: `Area ${id}` }],
            }));
            setSelected(id);
          }}
          renderContent={(content) => (
            <p>
              {content === "dropped-card"
                ? "Dropped content rendered by the parent."
                : `Caller-rendered ${content}.`}
            </p>
          )}
        />
      </div>
      <details>
        <summary>Serializable layout</summary>
        <pre>{JSON.stringify(layout, null, 2)}</pre>
      </details>
    </div>
  );
};
