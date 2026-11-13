import { GridSelectCell } from "./GridSelectCell/GridSelectCell";
import { gridTypes } from "./GridLayoutDisplay.types";
import type { GridLayoutDisplayProps, GridType } from "./GridLayoutDisplay.types";
import "./GridSelectCell/css/grid-select-cell.css";

export const GridLayoutDisplay = ({
  className = "",
  ...props
}: GridLayoutDisplayProps) => {

  return (
    <div className={`grid-layout-display ${className}`}>
      {(Object.keys(gridTypes) as GridType[]).map((gridType) => (
        <GridSelectCell
          key={gridType}
          {...props}
          grid={gridType}
        />
      ))}
    </div>
  );
};
