import type { GridCellProps } from "./GridCell.types";
import "./css/grid-cell.css";

export const STYLERS = {
  main: { container_class: "container-main", cell_class: "container-cell" },
  alt: { container_class: "container-metal", cell_class: "container-ghost" },
  inset: {
    container_class: "container-cell",
    cell_class: "container-cell container-cell--inset",
  },
  float: {
    container_class: "container-cell container-cell--float",
    cell_class: "container-cell",
  },
  metal: {
    container_class: "container-metal",
    cell_class: "container-cell container-cell--inset",
  },
} as const;

export const GridCell = ({
  children,
  className = "",
  data_area,
  container_class,
  cell_class,
  styler,
  scroll,
  padding,
}: GridCellProps) => {
  const preset = styler ? STYLERS[styler] : undefined;
  const cellClass = `grid-cell__cell ${cell_class ?? preset?.cell_class ?? ""}`;
  const scrollClass = `grid-cell__scroll scroll-${scroll}`;
  const namedPadding =
    padding !== undefined && ["sm", "md", "lg"].includes(padding);
  const pad = namedPadding ? `pad-${padding}` : "";
  const rootClass = `grid-cell ${container_class ?? preset?.container_class ?? ""} ${pad} ${className}`;
  const style =
    padding !== undefined && !namedPadding ? { padding } : undefined;
  return (
    <div
      data-area={data_area}
      data-cols="1"
      data-rows="1"
      className={rootClass}
      style={style}
    >
      <div data-cols="1" data-rows="1" className={cellClass}>
        {scroll ? (
          <div className={scrollClass}>{children}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};
