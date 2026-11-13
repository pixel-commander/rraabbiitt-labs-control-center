import { useId } from "react";
import type { ReactNode, CSSProperties, RefObject } from "react";
import { gridTypes } from "../../../../components/GridLayoutDisplay/GridLayoutDisplay.types";
import type { FactoryEditorProps, FactoryGridLayout } from "./ComponentFactory.types";
import { layoutCells, rootCells } from "./js/gridSlots";
import { factoryPaintClass, factoryPaintCss } from "./js/paintStyles";
import { cellLayoutCss, elementClass, elementStyle, elementTag, gridAttributes, slotStyle, surfaceClass } from "./js/renderStyles";

const elementDragType = "application/x-component-factory-element";

interface CanvasProps extends FactoryEditorProps {
  container_ref: RefObject<HTMLDivElement | null>;
}

export const Canvas = ({ editor, container_ref }: CanvasProps) => {
  const canvasId = useId();
  const { grid, frame, elements } = editor.composition;
  const shellLayout = editor.composition.gridStyle?.gridLayout ?? { grid };
  const areas = gridTypes[grid];
  const renderSlots = (layout: FactoryGridLayout, owner: string, tag: "div" | "span", content: ReactNode) =>
    layoutCells(layout, owner).map((cell, index) =>
      renderArea(cell.key, cell.name, slotStyle(layout, index), cell.receivesContent ? content : null, tag),
    );

  const renderArea = (
    area: string, name?: string, placement?: CSSProperties,
    inherited?: ReactNode, AreaTag: "div" | "span" = "div",
  ): ReactNode => {
    const areaStyle = editor.composition.areaStyles?.[area];
    const areaLayout = areaStyle?.gridLayout;
    const selected = editor.area === area && !editor.selected;
    const temporaryClass = factoryPaintClass(`area:${area}`, editor.composition.name);
    const content = (
      <>
        {inherited}
        {elements.filter((item) => item.area === area).map((item) => {
          const Tag = elementTag(item);
          return (
            <div
              key={item.id}
              className="component-factory-element"
              data-selected={editor.selected?.id === item.id}
              role="button"
              tabIndex={0}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData(elementDragType, String(item.id));
              }}
              onClick={(event) => {
                event.stopPropagation();
                editor.selectArea(area, item.id);
              }}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                editor.selectArea(area, item.id);
              }}
            >
              <Tag
                {...gridAttributes(item.gridLayout)}
                href={Tag === "a" ? "#" : undefined}
                onClick={Tag === "a" ? (event) => event.preventDefault() : undefined}
                className={[elementClass(item), factoryPaintClass(`item:${item.id}`, editor.composition.name)].filter(Boolean).join(" ")}
                aria-pressed={Tag === "button" ? editor.selected?.id === item.id : undefined}
                disabled={Tag === "button" && item.disabled ? true : undefined}
                style={elementStyle(item)}
                tabIndex={Tag === "button" ? -1 : undefined}
              >
                {item.gridLayout ? renderSlots(item.gridLayout, String(item.id), item.type === "Div" && Tag !== "span" ? "div" : "span", item.text) : item.text}
              </Tag>
              <button
                type="button"
                className="component-factory-clear"
                aria-label={`Remove ${item.type}`}
                onClick={(event) => {
                  event.stopPropagation();
                  editor.removeElement(item.id);
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </>
    );
    return (
      <AreaTag
        key={area}
        data-area={name}
        {...gridAttributes(areaLayout)}
        className={["component-factory-area", surfaceClass(areaStyle), areaStyle?.scrollY && "scroll-y", temporaryClass].filter(Boolean).join(" ")}
        style={placement}
        tabIndex={0}
        aria-label={`Select ${name ?? area} area`}
        data-selected={selected}
        onClick={(event) => {
          event.stopPropagation();
          editor.selectArea(area);
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
          event.preventDefault();
          event.stopPropagation();
          editor.selectArea(area);
        }}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes(elementDragType)) event.preventDefault();
        }}
        onDrop={(event) => {
          const id = event.dataTransfer.getData(elementDragType);
          if (!id) return;
          event.preventDefault();
          event.stopPropagation();
          editor.moveElement(Number(id), area);
        }}
      >
        {areaLayout ? renderSlots(areaLayout, area, AreaTag, content) : content}
      </AreaTag>
    );
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
      <style>{[
        factoryPaintCss(editor.composition, `[data-factory-canvas="${canvasId}"] `),
        cellLayoutCss(editor.composition, `[data-factory-canvas="${canvasId}"] `),
      ].join("\n")}</style>
      <div className="component-factory-world" style={{ minWidth: frame.x + frame.width + 24, minHeight: frame.y + frame.height + 24 }}>
        <div className="component-factory-frame" data-selected={editor.frameSelected} style={{ left: frame.x, top: frame.y, width: frame.width, height: frame.height }}>
          <div {...gridAttributes(editor.composition.gridStyle?.gridLayout ?? { grid })} className={`component-factory-layout ${surfaceClass(editor.composition.gridStyle)} ${factoryPaintClass("shell", editor.composition.name)}`}>
            {rootCells(shellLayout, areas).map((cell, index) =>
              renderArea(
                cell.key,
                cell.name,
                cell.inheritedAreas ? slotStyle(shellLayout, index) : undefined,
                cell.inheritedAreas?.map((area) => renderArea(area)),
              ),
            )}
          </div>
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
