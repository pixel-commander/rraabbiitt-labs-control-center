import { StateCell } from "./components/StateCell/StateCell";
import type { StatCellsProps } from "./StatCells.types";
import "../../atoms/containers/container-main/container-main.css";
import "./css/stat-cells.css";

const STYLER = {
  main: {
    container_class: "",
    cell_class: "container-cell container-cell--inset",
  },
  alt: {
    container_class: "container-cell container-cell--inset",
    cell_class: "container-main",
  },
};

export const StatCells = ({
  cells = [],
  className,
  mode = "main",
  pad,
  size = "md",
  container_class = STYLER[mode].container_class,
}: StatCellsProps) => {
  return (
    <div data-size={size} className={["stat-cells", container_class, pad && `pad-${pad}`, className].filter(Boolean).join(" ")}>
      {cells.map((cell, index) => (
        <StateCell
          key={cell.id ?? index}
          {...cell}
          cell_class={cell.cell_class ?? STYLER[mode].cell_class}
        />
      ))}
    </div>
  );
};
