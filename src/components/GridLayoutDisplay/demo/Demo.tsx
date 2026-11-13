import { useState } from "react";
import { GridLayoutDisplay } from "../GridLayoutDisplay";
import type { GridType } from "../GridLayoutDisplay.types";

export const Demo = () => {
  const [grid, setGrid] = useState<GridType>("holy-grail");

  return (
    <div className="demo container-demos" data-area="main" data-cols="1">
      <GridLayoutDisplay
        selected={grid}
        handleClick={(data) => {
          if (data) setGrid(data.grid);
        }}
      />
    </div>
  );
};
