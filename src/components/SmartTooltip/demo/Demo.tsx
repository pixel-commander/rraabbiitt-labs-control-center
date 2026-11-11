import { useRef } from "react";
import { SmartTooltip } from "../SmartTooltip";
import type { SmartTooltipPlacement } from "../SmartTooltip.types";

const placements: SmartTooltipPlacement[] = [
  "above",
  "below",
  "left",
  "right",
  "before",
  "after",
];

const PlacementDemo = ({ placement }: { placement: SmartTooltipPlacement }) => {
  const targetRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={targetRef} className="container-cell pad">
      <h3>{placement}</h3>
      <p>
        Hover inside this container
        {placement === "before" || placement === "after"
          ? " and move left or right"
          : ""}
        .
      </p>
      <SmartTooltip
        targetRef={targetRef}
        title={`Placement: ${placement}`}
        placement={placement}
      >
        <span>
          Formatted <strong>React content</strong>. Flips when the preferred
          side has no room.
        </span>
      </SmartTooltip>
    </div>
  );
};

export const Demo = () => {
  return (
    <div>
      {placements.map((placement) => (
        <PlacementDemo key={placement} placement={placement} />
      ))}
    </div>
  );
};
