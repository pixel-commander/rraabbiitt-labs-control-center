import type {
  DesignerDocument,
  DesignerElement,
} from "../RABDesigner.types.ts";
import { newElement, locate, updateNodes } from "./document.ts";
// Names and area order from src/css/grid.css. Templates remain owned there.
export const viewGrids: Record<string, readonly string[]> = {
  "header-main": ["header", "main"],
  "main-footer": ["main", "footer"],
  shell: ["header", "main", "footer"],
  "side-left": ["side", "main"],
  "side-right": ["main", "side"],
  "side-cols": ["left", "main", "right"],
  "holy-grail": ["header", "left", "main", "right", "footer"],
};
export function setViewGrid(
  data: DesignerDocument,
  grid: string,
): DesignerDocument {
  if (data.mode !== "view" || !Object.hasOwn(viewGrids, grid))
    throw Error("Invalid View grid.");
  const previous = data.children[0];
  if (previous?.["data-grid"] === grid) return data;
  const root = previous ?? {
    ...newElement("box", 0, 0, 1120, 720),
    title: "Page view",
    layout: { width: "100%", height: "100%" },
  };
  const children = viewGrids[grid].map(
    (area) =>
      root.children.find((n) => n["data-area"] === area) ?? {
        ...newElement("box", 0, 0),
        title: area,
        "data-area": area,
        layout: {
          height: area === "header" || area === "footer" ? "80px" : "auto",
          ...(area === "side" || area === "left" || area === "right"
            ? { minWidth: "200px" }
            : {}),
        },
      },
  );
  const displaced = root.children.filter(
    (n) => !children.some((c) => c.id === n.id),
  );
  const main = children.find((n) => n["data-area"] === "main")!;
  const preserved = displaced.flatMap((n) =>
    n.content ? [{ ...n, "data-area": undefined }] : n.children,
  );
  return {
    ...data,
    children: [
      {
        ...root,
        "data-grid": grid,
        children: children.map((n) =>
          n === main ? { ...n, children: [...n.children, ...preserved] } : n,
        ),
      },
    ],
  };
}
export function addViewElement(
  data: DesignerDocument,
  selected: number | undefined,
  node: DesignerElement,
): DesignerDocument {
  const parent = locate(data.children, selected)?.node;
  if (!parent || parent.type !== "box" || parent["data-grid"])
    throw Error("Select a page area or a div inside it first.");
  return {
    ...data,
    children: updateNodes(data.children, parent.id, {
      children: [
        ...parent.children,
        { ...node, x: 0, y: 0, layout: { ...node.layout, height: "auto" } },
      ],
    }),
  };
}
