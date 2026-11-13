import { useEffect, useRef, useState } from "react";
import { dragSort } from "../drag-sort.js";
import "./demo.css";
export const Demo = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState(["Plan", "Build", "Review", "Ship"]);
  useEffect(
    () =>
      dragSort(ref, {
        handleSort: (data) => {
          if (data) setRows(data.ids);
        },
      }),
    [],
  );
  return (
    <div ref={ref} className="drag-sort-demo">
      {rows.map((name) => (
        <div key={name} data-sort-id={name} className="container-cell pad">
          {name}
        </div>
      ))}
    </div>
  );
};
