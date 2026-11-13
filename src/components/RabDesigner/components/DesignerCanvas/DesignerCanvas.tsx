import type { CSSProperties } from "react";
import type { DesignerCanvasProps } from "./DesignerCanvas.types";
import { useDesignerCanvas } from "../../hooks/useDesignerCanvas";
import { DesignerNode } from "../DesignerNode/DesignerNode";
import { DesignerToolbar } from "../DesignerToolbar/DesignerToolbar";
import "./css/designer-canvas.css";
import { locate } from "../../js/document";
import { isHtml } from "../../js/htmlModel";
import { DesignerHtmlNode } from "../DesignerHtmlNode/DesignerHtmlNode";
export const DesignerCanvas = (props: DesignerCanvasProps) => {
  const { root, ...events } = useDesignerCanvas(props);
  const { view } = props;
  const selection = locate(props.data.children, props.selected);
  return (
    <div
      ref={root}
      tabIndex={0}
      aria-label="Design canvas"
      className={["designer-canvas", "container-canvas", props.className]
        .filter(Boolean)
        .join(" ")}
      data-tool={props.tool}
      onPointerDown={events.handlePointerDown}
      onPointerMove={events.handlePointerMove}
      onPointerUp={events.handlePointerUp}
      onPointerCancel={events.handlePointerCancel}
      style={
        {
          "--canvas-dot-step": `${24 * view.scale}px`,
          "--canvas-x": `${view.x}px`,
          "--canvas-y": `${view.y}px`,
        } as CSSProperties
      }
    >
      <div
        className="designer-world"
        style={
          {
            ...props.data.theme,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          } as CSSProperties
        }
      >
        {props.data.children.map((node) =>
          isHtml(props.data) ? (
            <DesignerHtmlNode {...props} key={node.id} node={node} isRoot />
          ) : (
            <DesignerNode
              {...props}
              key={node.id}
              node={node}
              className={undefined}
            />
          ),
        )}
      </div>
      {selection && !isHtml(props.data) && (
        <svg className="designer-guides" aria-hidden="true">
          <line
            className="container-canvas-guide"
            x1={view.x + (selection.x + selection.node.width) * view.scale}
            x2={view.x + (selection.x + selection.node.width) * view.scale}
            y1="0"
            y2="100%"
            strokeDasharray="4 5"
          />
          <line
            className="container-canvas-guide"
            x1="0"
            x2="100%"
            y1={view.y + (selection.y + selection.node.height / 2) * view.scale}
            y2={view.y + (selection.y + selection.node.height / 2) * view.scale}
            strokeDasharray="4 5"
          />
        </svg>
      )}
      <DesignerToolbar {...props} />
      {!props.data.children.length && (
        <div className="designer-empty container-cell-content-muted">
          <strong>Your canvas. Your composition.</strong>
          <span>Choose Box and drag to draw. Add text with T.</span>
          <span>Scroll to zoom · Space + drag to pan</span>
        </div>
      )}
    </div>
  );
};
