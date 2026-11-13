import { Fragment, useId } from "react";
import type { ReactNode, RefObject } from "react";
import type { FactoryEditorProps, EditorFactoryNode } from "./ComponentFactory.types";
import { factoryPaintClass } from "./js/paintStyles";
import { compositionCode } from "./js/compositionCode";
import { elementStyle, gridAttributes, slotStyle, surfaceClass } from "./js/renderStyles";

const elementDragType = "application/x-component-factory-element";

interface CanvasProps extends FactoryEditorProps {
  container_ref: RefObject<HTMLDivElement | null>;
}

export const Canvas = ({ editor, container_ref }: CanvasProps) => {
  const canvasId = useId();
  const { grid, frame, elements } = editor.composition;
  const RootTag = editor.renderDocument.root.tag;
  const renderNode = (node: EditorFactoryNode, parent: EditorFactoryNode, index: number): ReactNode => {
    const item = elements.find(item => item.id === node.id);
    const isArea = node.kind === "area";
    const area = isArea ? node.area ?? String(node.id) : item?.area ?? "main";
    const Tag = node.tag;
    const placement = parent.layout ? slotStyle(parent.layout, index) : undefined;
    const selected = isArea ? editor.area === area && !editor.selected : editor.selected?.id === node.id;
    const key = isArea ? `area:${area}` : `item:${node.id}`;
    const content = <Tag
      {...gridAttributes(node.layout)}
      data-area={isArea ? node.area?.split("/").at(-1) : undefined}
      className={[isArea && "component-factory-area", node.container_class, node.atom_class, node.effect_class, node.name, factoryPaintClass(key, editor.composition.name)].filter(Boolean).join(" ")}
      style={isArea ? placement : item ? elementStyle(item) : node.css}
      href={Tag === "a" ? node.href ?? "#" : undefined}
      disabled={Tag === "button" ? node.disabled : undefined}
      data-selected={isArea ? selected : undefined}
      tabIndex={isArea ? 0 : undefined}
      onClick={event => {
        event.preventDefault(); event.stopPropagation();
        editor.selectArea(area, isArea ? undefined : node.id);
      }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault(); event.stopPropagation(); editor.selectArea(area, isArea ? undefined : node.id);
      }}
      onDragOver={event => { if (event.dataTransfer.types.includes(elementDragType)) { event.preventDefault(); event.stopPropagation(); } }}
      onDrop={event => {
        const dragged = event.dataTransfer.getData(elementDragType);
        if (!dragged) return;
        event.preventDefault(); event.stopPropagation();
        editor.moveElement(Number(dragged), isArea ? area : `${node.id}/content`);
      }}
    >{node.text}{node.children?.map((child, index) => renderNode(child, node, index))}</Tag>;
    if (isArea) return <Fragment key={node.id}>{content}</Fragment>;
    return <div key={node.id} className="component-factory-element" data-selected={selected} role="button" tabIndex={0}
      onKeyDown={event => {
        if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault(); event.stopPropagation(); editor.selectArea(area, node.id);
      }}
      style={placement} draggable onDragStart={event => {
        event.stopPropagation(); event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(elementDragType, String(node.id));
      }}>
      {content}
      <button type="button" className="component-factory-clear" aria-label={`Remove ${node.name}`}
        onClick={event => { event.stopPropagation(); editor.removeElement(node.id); }}>×</button>
    </div>;
  };
  return (
    <div
      data-area="main"
      className="scroll-y component-factory-canvas"
      data-factory-canvas={canvasId}
      data-canvas-background={editor.theme}
      ref={container_ref}
      onClick={(event) => {
        if (event.target instanceof Element &&
            !event.target.closest(".component-factory-area, .component-factory-handle")) {
          if (event.target.closest(".component-factory-frame")) editor.selectFrame();
          else editor.clearSelection();
        }
      }}
    >
      <style>{compositionCode(editor.document).css.replace(/^(\.[^{]+)\{/gm, `[data-factory-canvas="${canvasId}"] $1{`)}</style>
      <div className="component-factory-world" style={{ minWidth: frame.x + frame.width + 24, minHeight: frame.y + frame.height + 24 }}>
        <div className="component-factory-frame" data-selected={editor.frameSelected} style={{ left: frame.x, top: frame.y, width: frame.width, height: frame.height }}>
          <RootTag {...gridAttributes(editor.renderDocument.root.layout)} className={`component-factory-layout ${surfaceClass(editor.composition.gridStyle)} ${editor.renderDocument.root.atom_class ?? ""} ${editor.renderDocument.root.name} ${factoryPaintClass("shell", editor.composition.name)}`}>
            {editor.renderDocument.root.text}
            {editor.renderDocument.root.children?.map((node, index) => renderNode(node, editor.renderDocument.root, index))}
          </RootTag>
          {editor.area !== undefined && !editor.selected && (
            <span className="component-factory-cell-tag" aria-hidden="true">
              {factoryPaintClass(`area:${editor.area}`, editor.composition.name)}
            </span>
          )}
          {editor.frameSelected && ["move", "n", "ne", "e", "se", "s", "sw", "w", "nw"].map((edge) => (
            <button
              key={edge}
              type="button"
              className="component-factory-handle"
              data-edge={edge}
              aria-label={edge === "move" ? "Move grid" : `Resize grid ${edge}`}
              onPointerDown={(event) => editor.startGesture(event, edge)}
              onPointerMove={editor.moveGesture}
              onLostPointerCapture={editor.endGesture}
              onPointerUp={editor.endGesture}
              onPointerCancel={editor.endGesture}
            >
              {edge === "move" ? grid : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
