import type { CSSProperties } from "react";
import type { GridAreaSelectProps } from "./GridAreaSelect.types";
import { useGridAreaSelect } from "./hooks/useGridAreaSelect/useGridAreaSelect";
import "./css/grid-area-select.css";
import "./css/grid-area-select-atoms.css";
const edges = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
export const GridAreaSelect = (props: GridAreaSelectProps) => {
  const {
    layout,
    selected,
    disabled = false,
    className = "",
    style,
    mime = "text/x-drop-load-id",
    renderContent,
  } = props;
  const grid = useGridAreaSelect(props);
  return (
    <div
      ref={grid.ref}
      data-grid="area-select"
      className={`grid-area-select container-inset ${className}`.trim()}
      style={
        {
          ...style,
          "--area-select-cols": grid.cols,
          "--area-select-rows": grid.rows,
        } as CSSProperties
      }
      aria-label={props.title ?? "Grid area editor"}
      tabIndex={0}
      onPointerDown={(event) => grid.begin(event, "create")}
      onPointerMove={grid.move}
      onPointerUp={(event) => grid.finish(event)}
      onPointerCancel={(event) => grid.finish(event, true)}
      onLostPointerCapture={(event) => grid.finish(event, true)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget || disabled) return;
        if (event.key === "Delete" && selected !== undefined) {
          const area = layout.areas.find((item) => item.id === selected);
          if (area) {
            event.preventDefault();
            grid.remove(area);
          }
        }
      }}
    >
      {Array.from({ length: grid.cols * grid.rows }, (_, index) => (
        <div
          key={index}
          className="grid-area-select__cell"
          aria-hidden="true"
          style={{
            gridColumn: (index % grid.cols) + 1,
            gridRow: Math.floor(index / grid.cols) + 1,
          }}
        />
      ))}
      {layout.areas.map((area, index) => (
        <section
          key={area.id}
          className={`grid-area-select__area container-cell${selected === area.id ? " grid-area-select__area--selected" : ""}`}
          data-grid="header-main"
          style={{
            gridColumn: `${area.c1} / span ${area.cols}`,
            gridRow: `${area.r1} / span ${area.rows}`,
          }}
          aria-label={area.title ?? area.name ?? `Area ${index + 1}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => {
            if (!disabled) {
              grid.ref.current?.focus();
              props.handleClick?.(area, "select", { ...props });
            }
          }}
          onDragOver={(event) => {
            if (
              !disabled &&
              (props.handleChange || props.handleDrop) &&
              (event.dataTransfer.types.includes(mime) ||
                event.dataTransfer.types.includes("text/plain"))
            ) {
              event.preventDefault();
              event.stopPropagation();
              event.dataTransfer.dropEffect = "copy";
            }
          }}
          onDrop={(event) => {
            if (disabled) return;
            const content =
              event.dataTransfer.getData(mime) ||
              event.dataTransfer.getData("text/plain");
            if (!content) return;
            event.preventDefault();
            event.stopPropagation();
            props.handleDrop?.({ area, content }, "drop", { ...props });
            props.handleChange?.(
              {
                ...layout,
                areas: layout.areas.map((item) =>
                  item.id === area.id ? { ...item, content } : item,
                ),
              },
              "drop",
              { ...props },
            );
          }}
        >
          <header data-area="header" data-grid="side-right">
            <button
              type="button"
              data-area="main"
              className="action-main grid-area-select__move"
              disabled={disabled}
              onPointerDown={(event) => grid.begin(event, "move", index)}
              aria-label={`Move area ${index + 1}`}
            >
              {area.title ?? area.name ?? `Area ${index + 1}`}
            </button>
            <button
              type="button"
              data-area="side"
              className="action-main"
              disabled={disabled}
              aria-label={`Remove area ${index + 1}`}
              onClick={(event) => {
                event.stopPropagation();
                grid.remove(area);
              }}
            >
              ×
            </button>
          </header>
          <div data-area="main" className="grid-area-select__body">
            <div className="grid-area-select__content">
              {area.content !== undefined
                ? renderContent
                  ? renderContent(area.content, area)
                  : area.content
                : null}
            </div>
          </div>
          {!disabled &&
            edges.map((edge) => (
              <span
                key={edge}
                aria-hidden="true"
                className={`grid-area-select__resize grid-area-select__resize--${edge}`}
                onPointerDown={(event) =>
                  grid.begin(event, "resize", index, edge)
                }
              />
            ))}
        </section>
      ))}
      {grid.preview && (
        <div
          aria-hidden="true"
          className={`grid-area-select__preview${grid.blocked ? " grid-area-select__preview--blocked" : ""}`}
          style={{
            gridColumn: `${grid.preview.c1} / span ${grid.preview.cols}`,
            gridRow: `${grid.preview.r1} / span ${grid.preview.rows}`,
          }}
        />
      )}
    </div>
  );
};
