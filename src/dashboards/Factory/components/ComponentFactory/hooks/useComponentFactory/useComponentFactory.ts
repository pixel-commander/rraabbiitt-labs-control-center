import { useRef, useState } from "react";
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

export const useComponentFactory = (props: ComponentFactoryProps) => {
  const [composition, setComposition] = useState(initialComposition);
  const [gridTab, setGridTab] = useState("Grid");
  const [styleTab, setStyleTab] = useState("Style");
  const [compositionTab, setCompositionTab] = useState("HTML");
  const [theme, setTheme] = useState<FactoryTheme>();
  const [area, setArea] = useState<string>();
  const [frameSelected, setFrameSelected] = useState(true);
  const [selectedId, setSelectedId] = useState<number>();
  const [gridDraft, setGridDraft] = useState<GridLayout>();
  const [draftArea, setDraftArea] = useState<number>();

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
          gridStyle: { ...current.gridStyle, gridLayout: undefined },
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
        gridStyle: { ...current.gridStyle, gridLayout: undefined },
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
    setComposition((current) => ({
      ...current,
      elements: current.elements.filter((element) => element.id !== id),
    }));
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
        return { ...current, gridStyle: { ...current.gridStyle, ...patch } };
      }
      return {
        ...current,
        areaStyles: {
          ...current.areaStyles,
          [area]: { ...current.areaStyles?.[area], ...patch },
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
        element.id === selectedId ? { ...element, ...patch } : element,
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
    if (action === "save" && props.handleSubmit) {
      return props.handleSubmit(composition, "save", props);
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
        element.id === id ? { ...element, area: nextArea } : element,
      ),
    }));
    selectArea(nextArea, id);
  };

  return {
    composition, area, selected, gridTab, styleTab, compositionTab, setCompositionTab, theme,
    gridDraft, setGridDraft, draftArea, setDraftArea, openGridDraft, addDraftArea,
    setName: (name: string) => setComposition((current) => ({ ...current, name })),
    setColor: (name: string, color: string) => setComposition((current) => ({ ...current, colors: { ...current.colors, [name]: color } })),
    setGridTab, setStyleTab, setTheme, selectGrid, selectFrame, frameSelected, clearSelection, selectArea, removeElement,
    addElement, updateElement, updateSurface, moveElement, startGesture, moveGesture, endGesture, handleAction,
  };
};
