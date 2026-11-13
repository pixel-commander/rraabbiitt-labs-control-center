import type { CSSProperties } from "react";
import type { DesignerHtmlNodeProps } from "./DesignerHtmlNode.types";
import { resolveElement, allowsWidth } from "../../js/htmlModel";
import { htmlStyle } from "../../js/site";
import { canvasAppearance } from "../../js/canvasAppearance";
import "./css/designer-html-node.css";

export const DesignerHtmlNode = (props: DesignerHtmlNodeProps) => {
  const node = resolveElement(props.data, props.node),
    active = node.id === props.selected,
    Tag = node.type === "text" ? "span" : "div";
  const element = (
    <Tag
      data-grid={node["data-grid"]}
      data-area={node["data-area"]}
      data-node={node.id}
      data-node-type={node.type}
      data-flow={props.isRoot ? undefined : "true"}
      role="group"
      aria-label={node.title}
      aria-current={active ? "true" : undefined}
      data-preview-state={
        active && props.previewState !== "normal"
          ? props.previewState
          : undefined
      }
      data-cols={
        !node["data-grid"] &&
        (node.layout?.display ?? (node.grid ? "grid" : "block")) === "grid"
          ? (node.cols ?? 2)
          : undefined
      }
      className={[
        "designer-html-node",
        "container-cell",
        "effect-canvas",
        "action-canvas",
        node.className,
        active ? "is-selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          ...htmlStyle(node, props.data.mode),
          position: "relative",
          "--canvas-scale": props.view.scale,
        } as CSSProperties
      }
    >
      {node.appearance && (
        <style>{canvasAppearance(node.id, node.appearance)}</style>
      )}
      {node.content}
      {node.children.map((child) => (
        <DesignerHtmlNode
          {...props}
          key={child.id}
          node={child}
          isRoot={false}
        />
      ))}
      {active && (
        <>
          <span className="designer-node-label container-canvas-label">
            {node.className ?? node.title}
          </span>
          {(props.data.mode === "view"
            ? []
            : props.isRoot || allowsWidth(props.data.mode, node)
              ? ["nw", "n", "ne", "e", "se", "s", "sw", "w"]
              : ["n", "s"]
          ).map((edge) => (
            <span
              key={edge}
              data-resize={edge}
              aria-hidden="true"
              className={`designer-handle designer-handle-${edge} container-canvas-handle`}
            />
          ))}
        </>
      )}
    </Tag>
  );
  return props.isRoot ? (
    <div
      data-editor-frame={node.id}
      className="designer-html-frame"
      style={{
        left: props.node.x,
        top: props.node.y,
        width: node.width,
        height: node.height,
      }}
    >
      {element}
    </div>
  ) : (
    element
  );
};
