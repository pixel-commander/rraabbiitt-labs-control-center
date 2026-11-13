import { useEffect, useRef } from "react";
import { resizeColumns } from "../resize-columns.js";
import "./demo.css";
export const Demo = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => resizeColumns(ref, { min_rem: 4, max_rem: 16 }), []);
  return (
    <div ref={ref} data-grid="sides" className="resize-columns-demo">
      <div data-area="left" className="container-cell pad">
        Left
        <div data-resize="left" />
      </div>
      <div data-area="main" className="container-cell pad">
        Drag either divider
      </div>
      <div data-area="right" className="container-cell pad">
        <div data-resize="right" />
        Right
      </div>
    </div>
  );
};
