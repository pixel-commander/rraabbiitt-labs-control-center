import "./css/tool-col.css";
import type { ToolColProps } from "./ToolCol.types";

export const ToolCol = ({
  children = null,
  className = "",
  is_open = false,
}: ToolColProps) => {
  return (
    <aside
      data-area="right"
      className={["tool-col", is_open ? "is-open" : "is-closed", className]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={!is_open}
      inert={!is_open}
    >
      <div className="tool-col-inner" data-cols="1" data-rows="1">
        <div className="tool-col-scroll scroll-y">{children}</div>
      </div>
    </aside>
  );
};
