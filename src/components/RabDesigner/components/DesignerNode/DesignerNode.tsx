import { nodeStyle } from "../../js/nodeStyle";
import type { DesignerNodeProps } from "./DesignerNode.types";
import "./css/designer-node.css";
import { canvasAppearance } from "../../js/canvasAppearance";
export const DesignerNode = (props: DesignerNodeProps) => {
  const { node, selected, view, inGrid = false } = props;
  const settings = { ...props, inGrid };
  const active = node.id === selected;
  const style = nodeStyle(node, inGrid, view.scale);
  return (
    <div
      data-node={node.id}
      data-node-type={node.type}
      data-preview-state={
        active && props.previewState !== "normal"
          ? props.previewState
          : undefined
      }
      role="group"
      aria-label={node.title}
      aria-current={active ? "true" : undefined}
      className={[
        "designer-node",
        inGrid ? "designer-node-flow" : "",
        "container-cell effect-canvas",
        props.data.children.some((n) => n.id === node.id) &&
        node.children.length
          ? "container-canvas-frame"
          : "",
        "action-canvas",
        active ? "is-selected" : "",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {node.appearance && (
        <style>{canvasAppearance(node.id, node.appearance)}</style>
      )}
      {props.data.children.some((n) => n.id === node.id) &&
        node.children.length > 0 &&
        !active && (
          <span className="designer-node-label container-canvas-artboard-label">
            {node.title}
          </span>
        )}
      {node.content && (
        <span className="designer-node-content">{node.content}</span>
      )}
      {node.children.length > 0 && (
        <div
          className="designer-node-children"
          style={{
            gap: node.grid ? node.gap : undefined,
            padding: node.grid ? node.padding : undefined,
          }}
          data-cols={node.grid === "columns" ? (node.cols ?? 2) : undefined}
          data-rows={node.grid === "rows" ? (node.rows ?? 2) : undefined}
          data-gap={node.grid && node.gap === undefined ? "content" : undefined}
        >
          {node.children.map((child) => (
            <DesignerNode
              {...settings}
              key={child.id}
              node={child}
              inGrid={!!node.grid}
            />
          ))}
        </div>
      )}
      {active && (
        <>
          <span className="designer-node-label container-canvas-label">
            {node.title}
            {node.grid ? " · grid" : ""}
          </span>
          {!inGrid &&
            ["nw", "n", "ne", "e", "se", "s", "sw", "w"].map((edge) => (
              <span
                key={edge}
                data-resize={edge}
                aria-hidden="true"
                className={`designer-handle designer-handle-${edge} container-canvas-handle`}
              />
            ))}
        </>
      )}
    </div>
  );
};
