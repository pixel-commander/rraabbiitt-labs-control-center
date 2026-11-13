import { useRef } from "react";
import { SmartTooltip } from "../../SmartTooltip/SmartTooltip";
import { gridTypes } from "../GridLayoutDisplay.types";
import type { GridSelectCellProps } from "../GridLayoutDisplay.types";

export const GridSelectCell = ({
  grid,
  selected,
  handleClick,
  action_class = "action-ghost",
}: GridSelectCellProps) => {
  const className = `grid-select-cell-button pad-sm ${action_class ?? ""}${selected === grid ? " is-selected" : ""}`;
  const targetRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={targetRef}
        type="button"
        data-cols="1"
        data-rows="1"
        className={className}
        aria-label={grid}
        aria-pressed={selected === grid}
        onClick={() => handleClick?.({ grid }, "grid-select")}
      >
        <div
          data-grid={grid === "single-cell" ? undefined : grid}
          data-rows={grid === "single-cell" ? "1" : undefined}
          data-cols={grid === "single-cell" ? "1" : undefined}
          className="grid-select-cell"
          aria-hidden="true"
        >
          {gridTypes[grid].map((area) => (
            <div key={area} data-area={grid === "single-cell" ? undefined : area} data-cols="1" data-rows="1">
              <div className="grid-select-cell-inner" />
            </div>
          ))}
        </div>
      </button>
      <SmartTooltip targetRef={targetRef} content={grid} />
    </>
  );
};
