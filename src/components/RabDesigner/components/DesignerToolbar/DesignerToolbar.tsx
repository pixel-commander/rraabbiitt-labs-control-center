import type { DesignerToolbarProps } from "./DesignerToolbar.types";
import "./css/designer-toolbar.css";
const icons: Record<string, string> = {
  select: "M4 3 L17 12 L11 13 L8 19 Z",
  box: "M4 4 H20 V20 H4 Z",
  text: "M4 5 H20 M12 5 V21 M8 21 H16",
  hand: "M8 12 V5 Q8 2 10 5 V10 M10 10 V3 Q12 0 13 3 V10 M13 10 V5 Q15 2 16 5 V11 M16 11 V8 Q18 6 19 9 V16 Q19 22 13 22 Q10 22 8 19 L4 14 Q3 11 6 12 L8 14",
};
export const DesignerToolbar = (props: DesignerToolbarProps) => {
  return (
    <>
      <div
        className="designer-toolbar container-cell container-cell--float effect-float"
        role="toolbar"
        aria-label="Canvas tools"
        data-canvas-controls
      >
        {(["select", "box", "text", "hand"] as const)
          .filter((tool) => props.data.mode !== "view" || tool !== "box")
          .map((tool) => (
            <button type="button"
              key={tool}
              aria-label={
                tool === "box"
                  ? "Draw box"
                  : tool === "text"
                    ? "Add text"
                    : tool === "hand"
                      ? "Pan canvas"
                      : "Select and move"
              }
              aria-pressed={props.tool === tool}
              className={props.tool === tool ? "action-canvas-tool is-selected" : "action-canvas-tool"}
              title={{
                  select: "Select / move · V",
                  box: "Draw box · R",
                  text: "Add text · T",
                  hand: "Pan · H or Space + drag",
                }[tool]}
              onClick={() =>
                props.handleAction({ value: tool }, "tool", { ...props })
              }
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d={icons[tool]} />
              </svg>
            </button>
          ))}
        <span className="designer-divider container-canvas-divider" />
        <select
          aria-label="Canvas zoom"
          className="action-canvas-tool"
          value={String(props.view.scale)}
          onChange={(e) =>
            e.currentTarget.value === "fit"
              ? props.handleAction({}, "fit", { ...props })
              : props.handleAction(
                  { value: Number(e.currentTarget.value) },
                  "zoom",
                  { ...props },
                )
          }
        >
          <option value="fit">Fit to view</option>
          <option value={String(props.view.scale)}>
            {Math.round(props.view.scale * 100)}%
          </option>
          {[0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4]
            .filter((v) => v !== props.view.scale)
            .map((v) => (
              <option key={v} value={v}>
                {v * 100}%
              </option>
            ))}
        </select>
        <label className="designer-auto-mode">
          <input
            type="checkbox"
            checked={props.autoMode}
            onChange={(e) =>
              props.handleAction(
                { value: e.currentTarget.checked ? 1 : 0 },
                "auto",
                { ...props },
              )
            }
          />
          Auto mode
          <span>
            {props.tool === "select" && props.autoMode
              ? props.selected
                ? "Position"
                : "Drag / select"
              : ""}
          </span>
        </label>
      </div>
    </>
  );
};
