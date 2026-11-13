import { useEffect, useRef, useState } from "react";
import type { SetStateAction } from "react";
import { compositionToTree, readComposition, treeToComposition, toEditorDocument } from "../../js/compositionTree";
import type { PointerEvent } from "react";
import { newElement } from "../../../../../../components/RabDesigner/js/document";
import { gridTypes } from "../../../../../../components/GridLayoutDisplay/GridLayoutDisplay.types";
import type { GridType } from "../../../../../../components/GridLayoutDisplay/GridLayoutDisplay.types";
import type { GridArea, GridLayout } from "../../../../../../components/GridAreaSelect/GridAreaSelect.types";
import type {
  ComponentFactoryProps,
  FactoryComposition,
  FactoryElement,
  FactoryElementType,
  FactoryHeadline,
  FactoryLayoutTag,
  FactoryFrame,
  FactorySurfaceStyle,
  FactoryTheme,
} from "../../ComponentFactory.types";

const initialComposition: FactoryComposition = {
  grid: "holy-grail",
  frame: { x: 24, y: 24, width: 480, height: 280 },
  elements: [],
};

// Imported CSS supplies initial appearance. Explicit edits replace the corresponding declaration.
const stylePatch = <T extends FactorySurfaceStyle | Partial<FactoryElement>>(current: T, patch: Partial<T>): T => {
  const css = { ...current.css } as Record<string, unknown>;
  const aliases: Record<string, string[]> = {
    size: ["fontSize"], gap: ["gap"], padding: ["padding"], paddingSides: ["padding", "paddingLeft", "paddingRight", "paddingTop", "paddingBottom"],
    paint: [], background: ["background", "backgroundColor", "backgroundImage"], gradient: ["background", "backgroundColor", "backgroundImage"],
    radius: ["borderRadius"], radiusCorners: ["borderRadius", "borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius"],
    borders: ["border", "borderColor", "borderWidth", "borderStyle", "borderTop", "borderRight", "borderBottom", "borderLeft"], shadows: ["boxShadow"],
  };
  for (const key of [...Object.keys(patch), ...Object.keys(patch.paint ?? {})]) {
    for (const property of aliases[key] ?? [key]) delete css[property];
  }
  return { ...current, ...patch, css: Object.keys(css).length ? css : undefined } as T;
};

export const useComponentFactory = (props: ComponentFactoryProps) => {
  const [initial] = useState(() => {
    try { return { document: readComposition(props.json ?? initialComposition), error: undefined as string | undefined }; }
    catch (error) { return { document: readComposition(), error: error instanceof Error ? error.message : String(error) }; }
  });
  const [document, setDocument] = useState(initial.document);
  const [jsonError, setJsonError] = useState(initial.error);
  const composition = treeToComposition(document);
  const setComposition = (update: SetStateAction<FactoryComposition>) => setDocument(current => {
    const flat = treeToComposition(current);
    return compositionToTree(typeof update === "function" ? update(flat) : update, current);
  });
  useEffect(() => {
    if (props.json === undefined) return;
    loadJson(props.json);
  }, [props.json]);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [gridTab, setGridTab] = useState("Grid");
  const [styleTab, setStyleTab] = useState("Style");
  const [compositionTab, setCompositionTab] = useState("HTML");
  const [theme, setTheme] = useState<FactoryTheme>();
  const [area, setArea] = useState<string>();
  const [frameSelected, setFrameSelected] = useState(true);
  const [selectedId, setSelectedId] = useState<number>();
  const [gridDraft, setGridDraft] = useState<GridLayout>();
  const [draftArea, setDraftArea] = useState<number>();

  function loadJson(input: ComponentFactoryProps["json"]) {
    try {
      setDocument(readComposition(input)); setJsonError(undefined);
      setArea(undefined); setSelectedId(undefined); setFrameSelected(true); setGridDraft(undefined);
    } catch (error) { setJsonError(error instanceof Error ? error.message : String(error)); }
  }

  const openGridDraft = (layout?: GridLayout, rows = 4, cols = 6) => {
    setDraftArea(undefined);
    setGridDraft(layout ?? { rows, cols, areas: [] });
  };

  const addDraftArea = (area: Omit<GridArea, "id">) => {
    const { id } = newElement("text", 0, 0);
    setGridDraft((current) => current && {
      ...current,
      areas: [...current.areas, { ...area, id }],
    });
    setDraftArea(id);
  };
  const gesture = useRef<{
    pointer: number;
    x: number;
    y: number;
    frame: FactoryFrame;
    edge: string;
  }>(null);

  const selected = composition.elements.find((element) => element.id === selectedId);

  const selectGrid = (grid: GridType) => {
    if (grid === composition.grid) {
      if (composition.gridStyle?.gridLayout) {
        setComposition((current) => ({
          ...current,
          gridStyle: { ...current.gridStyle, gridLayout: { grid } },
        }));
      }
      return;
    }
    if (!window.confirm("Switch grids? Content in areas missing from the new grid will be deleted.")) return;

    setComposition((current) => {
      const survivingAreas = new Set(gridTypes[grid]);
      const elementAreas = new Map(current.elements.map((element) => [String(element.id), element.area]));
      const survives = (area: string) => {
        const visited = new Set<string>();
        let owner: string | undefined = area.split("/")[0];
        while (owner !== undefined && !visited.has(owner)) {
          if (survivingAreas.has(owner)) return true;
          visited.add(owner);
          owner = elementAreas.get(owner)?.split("/")[0];
        }
        return false;
      };
      return {
        ...current,
        grid,
        gridStyle: { ...current.gridStyle, gridLayout: { grid } },
        areaStyles: Object.fromEntries(
          Object.entries(current.areaStyles ?? {}).filter(([key]) => survives(key)),
        ),
        elements: current.elements.filter((element) => survives(element.area)),
      };
    });
    setArea(undefined);
    setSelectedId(undefined);
  };

  const removeElement = (id: number) => {
    setComposition((current) => {
      const removed = new Set([id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const element of current.elements) {
          if (removed.has(Number(element.area.split("/")[0])) && !removed.has(element.id)) {
            removed.add(element.id); changed = true;
          }
        }
      }
      return { ...current, elements: current.elements.filter(element => !removed.has(element.id)) };
    });
    if (selectedId === id) setSelectedId(undefined);
  };

  const selectFrame = () => {
    setFrameSelected(true);
    setArea(undefined);
    setSelectedId(undefined);
    setStyleTab("Style");
  };

  const clearSelection = () => {
    setFrameSelected(false);
    setArea(undefined);
    setSelectedId(undefined);
  };

  const updateSurface = (patch: FactorySurfaceStyle) => {
    setComposition((current) => {
      if (area === undefined) {
        return { ...current, gridStyle: stylePatch(current.gridStyle ?? {}, patch) };
      }
      return {
        ...current,
        areaStyles: {
          ...current.areaStyles,
          [area]: stylePatch(current.areaStyles?.[area] ?? {}, patch),
        },
      };
    });
  };

  const selectArea = (nextArea: string, id?: number, openLayout = true) => {
    setFrameSelected(false);
    setArea(nextArea);
    setSelectedId(id);
    if (openLayout) setGridTab("Layout");
    setStyleTab("Style");
  };

  const addElement = (type: FactoryElementType, options?: { heading?: FactoryHeadline; layoutTag?: FactoryLayoutTag }) => {
    if (area === undefined) return;
    const { id } = newElement("text", 0, 0);
    const element: FactoryElement = {
      id, type, area, text: type === "Div" ? "" : type,
      color: "#dfe4ee", size: 16, heading: options?.heading ?? "h2", container: "", effect: "", action: "",
      layoutTag: options?.layoutTag,
    };
    setComposition((current) => ({ ...current, elements: [...current.elements, element] }));
    setSelectedId(id);
  };

  const updateElement = (patch: Partial<FactoryElement>) => {
    setComposition((current) => ({
      ...current,
      elements: current.elements.map((element) =>
        element.id === selectedId ? { ...stylePatch(element, patch), nodeTag: patch.heading ?? patch.layoutTag ?? element.nodeTag } : element,
      ),
    }));
  };

  const startGesture = (event: PointerEvent<HTMLButtonElement>, edge: string) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      pointer: event.pointerId, x: event.clientX, y: event.clientY,
      frame: composition.frame, edge,
    };
  };

  const moveGesture = (event: PointerEvent<HTMLButtonElement>) => {
    const start = gesture.current;
    if (!start || start.pointer !== event.pointerId) return;
    const { frame, edge } = start;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const next = { ...frame };

    if (edge === "move") {
      next.x = Math.max(0, frame.x + dx);
      next.y = Math.max(0, frame.y + dy);
    } else {
      if (edge.includes("e")) next.width = Math.max(80, frame.width + dx);
      if (edge.includes("s")) next.height = Math.max(80, frame.height + dy);
      if (edge.includes("w")) {
        next.x = Math.max(0, Math.min(frame.x + dx, frame.x + frame.width - 80));
        next.width = frame.width + frame.x - next.x;
      }
      if (edge.includes("n")) {
        next.y = Math.max(0, Math.min(frame.y + dy, frame.y + frame.height - 80));
        next.height = frame.height + frame.y - next.y;
      }
    }

    setComposition((current) => ({ ...current, frame: next }));
  };

  const endGesture = (event: PointerEvent<HTMLButtonElement>) => {
    if (gesture.current?.pointer === event.pointerId) gesture.current = null;
  };

  const handleAction = (action: "new" | "open" | "export" | "save") => {
    if (action === "new") {
      loadJson(undefined); return;
    }
    if (action === "export") {
      const url = URL.createObjectURL(new Blob([JSON.stringify(document, null, 2)], { type: "application/json" }));
      const link = window.document.createElement("a");
      link.href = url; link.download = `${document.name || "composition"}.json`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      return;
    }
    if (action === "save" && props.handleSubmit) {
      return props.handleSubmit(document, "save", props);
    }
    props.handleClick?.({}, action, props);
  };

  const moveElement = (id: number, nextArea: string) => {
    if (!composition.elements.some((element) => element.id === id)) return;
    let parentArea: string | undefined = nextArea;
    while (parentArea) {
      const owner: string = parentArea.split("/")[0];
      if (owner === String(id)) return;
      parentArea = composition.elements.find((element) => String(element.id) === owner)?.area;
    }
    setComposition((current) => ({
      ...current,
      elements: current.elements.map((element) =>
        element.id === id ? { ...element, area: nextArea } : nextArea === `${element.id}/content` ? { ...element, childArea: nextArea } : element,
      ),
    }));
    selectArea(nextArea, id);
  };

  return {
    loadJson, jsonError,
    document, renderDocument: toEditorDocument(document),
    jsonOpen, setJsonOpen,
    composition, area, selected, gridTab, styleTab, compositionTab, setCompositionTab, theme,
    gridDraft, setGridDraft, draftArea, setDraftArea, openGridDraft, addDraftArea,
    setName: (name: string) => setComposition((current) => ({ ...current, name })),
    setColor: (name: string, color: string) => setComposition((current) => ({ ...current, colors: { ...current.colors, [name]: color } })),
    setGridTab, setStyleTab, setTheme, selectGrid, selectFrame, frameSelected, clearSelection, selectArea, removeElement,
    addElement, updateElement, updateSurface, moveElement, startGesture, moveGesture, endGesture, handleAction,
  };
};
