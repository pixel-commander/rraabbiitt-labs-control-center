import type { CSSProperties } from "react";
import type { GridDesignerProps, Track } from "./GridDesigner.types";
import { useGridDesigner } from "./hooks/useGridDesigner/useGridDesigner";
import { DEVICES, boxGridArea, trackListCss } from "./js/geometry/geometry";
import "../../atoms/actions/action-main/action-main.css";
import "../../atoms/containers/container-cell/container-cell.css";
import "./css/grid-designer.css";
export const GridDesigner = (props: GridDesignerProps) => {
  const {
    data,
    selected,
    className = "",
    container_class = "container-cell",
    cell_class = "container-cell",
    action_class = "action-main",
    disabled = false,
  } = props;
  const ui = useGridDesigner(props);
  const tracks = {
    gridTemplateColumns: trackListCss(data.colTracks, data.cols),
    gridTemplateRows: trackListCss(data.rowTracks, data.rows),
  };
  const device = DEVICES[ui.device as keyof typeof DEVICES];
  return (
    <div
      className={["grid-designer", container_class, className]
        .filter(Boolean)
        .join(" ")}
      data-grid="header-main"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          ui.cancel();
          ui.setSaveOpen(false);
        }
      }}
    >
      <div data-area="header" data-cols="1" className="grid-designer__toolbar">
        <fieldset disabled={disabled} data-cols="4">
          <label>
            Rows
            <input
              aria-label="Rows"
              type="number"
              min="1"
              value={data.rows}
              onChange={(e) => ui.resizeGrid(Number(e.target.value), data.cols)}
            />
          </label>
          <label>
            Columns
            <input
              aria-label="Columns"
              type="number"
              min="1"
              value={data.cols}
              onChange={(e) => ui.resizeGrid(data.rows, Number(e.target.value))}
            />
          </label>
          <label>
            View
            <select
              aria-label="Device preview"
              value={ui.device}
              onChange={(e) => ui.setDevice(e.target.value)}
            >
              <option value="">Fluid</option>
              {Object.entries(DEVICES).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={action_class}
            disabled={!props.handleSave}
            onClick={() => ui.setSaveOpen(true)}
          >
            Save grid
          </button>
        </fieldset>
        <div data-cols="2" className="grid-designer__tracks">
          {(["rowTracks", "colTracks"] as const).map((axis) => (
            <details key={axis}>
              <summary>
                {axis === "rowTracks" ? "Row tracks" : "Column tracks"}
              </summary>
              <fieldset disabled={disabled} data-cols="1">
                {data[axis].map((track, index) => (
                  <label key={index} data-cols="2">
                    {axis === "rowTracks" ? "Row" : "Column"} {index + 1}
                    <select
                      aria-label={`${axis} ${index + 1}`}
                      value={track.mode}
                      onChange={(e) =>
                        ui.updateTrack(axis, index, {
                          mode: e.target.value as Track["mode"],
                        })
                      }
                    >
                      <option value="1fr">1fr</option>
                      <option value="auto">auto</option>
                      <option value="manual">manual</option>
                    </select>
                    {track.mode === "manual" && (
                      <input
                        aria-label={`${axis} ${index + 1} size`}
                        value={track.manual}
                        onChange={(e) =>
                          ui.updateTrack(axis, index, {
                            manual: e.target.value,
                          })
                        }
                      />
                    )}
                  </label>
                ))}
              </fieldset>
            </details>
          ))}
        </div>
      </div>
      <div data-area="main" className="grid-designer__viewport">
        <div
          className="grid-designer__canvas"
          ref={ui.canvas}
          style={
            {
              ...tracks,
              ...(device ? { width: device.inline, height: device.block } : {}),
            } as CSSProperties
          }
          onPointerDown={(e) => ui.begin(e, "draw")}
          onPointerMove={ui.move}
          onPointerUp={ui.end}
          onPointerCancel={ui.cancel}
        >
          {Array.from({ length: data.rows * data.cols }, (_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="grid-designer__cell"
              style={{
                gridArea: `${Math.floor(i / data.cols) + 1} / ${(i % data.cols) + 1}`,
              }}
            />
          ))}
          {data.boxes.map((box) => (
            <article
              key={box.id}
              tabIndex={disabled ? -1 : 0}
              aria-label={`Grid area ${box.area ?? box.id}`}
              aria-current={selected === box.id ? "true" : undefined}
              className={[
                "grid-designer__box",
                cell_class,
                selected === box.id ? "is-selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ gridArea: boxGridArea(box) }}
              onFocus={() => {
                if (!disabled) props.handleSelect?.(box.id, "grid-box", props);
              }}
              onPointerDown={(e) => ui.begin(e, "move", box)}
            >
              <input
                aria-label={`Box ${box.id} area name`}
                disabled={disabled}
                placeholder="area-name"
                value={box.area ?? ""}
                onPointerDown={(e) => e.stopPropagation()}
                onChange={(e) =>
                  ui.change({
                    ...data,
                    boxes: data.boxes.map((b) =>
                      b.id === box.id ? { ...b, area: e.target.value } : b,
                    ),
                  })
                }
              />
              <button
                type="button"
                className={`grid-designer__remove ${action_class}`}
                disabled={disabled}
                aria-label={`Remove box ${box.id}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() =>
                  ui.change({
                    ...data,
                    boxes: data.boxes.filter((b) => b.id !== box.id),
                  })
                }
              >
                ×
              </button>
              <button
                type="button"
                className="grid-designer__resize"
                disabled={disabled}
                aria-label={`Resize box ${box.id}`}
                onPointerDown={(e) => ui.begin(e, "resize", box)}
              />
            </article>
          ))}
          {ui.draft && (
            <div
              className={`grid-designer__draft${ui.blocked ? " is-blocked" : ""}`}
              style={{ gridArea: boxGridArea(ui.draft) }}
            />
          )}
        </div>
      </div>
      {ui.status && <output role="status">{ui.status}</output>}
      {ui.saveOpen && (
        <dialog
          open
          aria-label="Save grid"
          className={`grid-designer__dialog ${container_class}`}
        >
          <form
            data-cols="1"
            onSubmit={(e) => {
              e.preventDefault();
              void ui.save(e.currentTarget);
            }}
          >
            <h2>Save grid</h2>
            <label>
              Name
              <input name="name" required defaultValue={props.name ?? ""} />
            </label>
            <label>
              Description
              <textarea
                name="description"
                defaultValue={props.description ?? ""}
              />
            </label>
            <div data-cols="2">
              <button
                className={action_class}
                disabled={disabled || ui.busy || !props.handleSave}
                type="submit"
              >
                {ui.busy ? "Saving…" : "Save"}
              </button>
              <button
                className={action_class}
                type="button"
                onClick={() => ui.setSaveOpen(false)}
              >
                Close
              </button>
            </div>
            <output role="status">{ui.status}</output>
          </form>
        </dialog>
      )}
    </div>
  );
};
