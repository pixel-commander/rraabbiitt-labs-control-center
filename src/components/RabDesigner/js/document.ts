import { setViewGrid } from "./viewGrid.ts";
let previousId = 0;
import type {
  DesignerDocument,
  DesignerElement,
  DesignerMode,
} from "../RABDesigner.types.ts";
export const newDocument = (
  mode: DesignerMode = "canvas",
): DesignerDocument => {
  const data: DesignerDocument = {
    schema: 1,
    mode,
    id: (previousId = Math.max(Date.now(), previousId + 1)),
    title: "Untitled composition",
    children: [],
  };
  return mode === "view" ? setViewGrid(data, "shell") : data;
};
export const newElement = (
  type: DesignerElement["type"],
  x: number,
  y: number,
  width = 160,
  height = 100,
): DesignerElement => ({
  id: (previousId = Math.max(Date.now(), previousId + 1)),
  title: type === "text" ? "Text" : "Box",
  type,
  x,
  y,
  width,
  height,
  content: type === "text" ? "Text" : "",
  surface: type === "text" ? "transparent" : "main",
  color: "default",
  fontSize: 16,
  children: [],
});
export function locate(
  nodes: DesignerElement[],
  id: number | undefined,
  x = 0,
  y = 0,
): { node: DesignerElement; x: number; y: number } | undefined {
  for (const node of nodes) {
    if (node.id === id) return { node, x: x + node.x, y: y + node.y };
    const child = locate(node.children, id, x + node.x, y + node.y);
    if (child) return child;
  }
}
export const updateNodes = (
  nodes: DesignerElement[],
  id: number,
  patch: Partial<DesignerElement>,
): DesignerElement[] =>
  nodes.map((n) =>
    n.id === id
      ? { ...n, ...patch }
      : { ...n, children: updateNodes(n.children, id, patch) },
  );
export const removeNode = (
  nodes: DesignerElement[],
  id: number,
): DesignerElement[] =>
  nodes
    .filter((n) => n.id !== id)
    .map((n) => ({ ...n, children: removeNode(n.children, id) }));
export function bounds(nodes: DesignerElement[]) {
  const all: { x: number; y: number; w: number; h: number }[] = [];
  const visit = (rows: DesignerElement[], x = 0, y = 0) => {
    for (const n of rows) {
      all.push({ x: x + n.x, y: y + n.y, w: n.width, h: n.height });
      visit(n.children, x + n.x, y + n.y);
    }
  };
  visit(nodes);
  if (!all.length) return { x: 0, y: 0, width: 1120, height: 720 };
  const x = Math.min(...all.map((n) => n.x)),
    y = Math.min(...all.map((n) => n.y));
  return {
    x,
    y,
    width: Math.max(...all.map((n) => n.x + n.w)) - x,
    height: Math.max(...all.map((n) => n.y + n.h)) - y,
  };
}
