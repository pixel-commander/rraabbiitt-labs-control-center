import type { DesignerElement, DesignerMode } from "../RABDesigner.types.ts";
import { allowsWidth } from "./htmlModel.ts";
export function resizeElement(
  node: DesignerElement,
  size: { width: number; height: number },
  edge: string,
  dx: number,
  dy: number,
  mode: DesignerMode = "canvas",
  isRoot = true,
): DesignerElement {
  const horizontal = /[ew]/.test(edge),
    vertical = /[ns]/.test(edge),
    left = edge.includes("w"),
    top = edge.includes("n");
  const canWidth = allowsWidth(mode, node),
    resizeWidth = horizontal && (canWidth || isRoot);
  const width = resizeWidth
    ? Math.max(8, Math.min(10000, size.width + (left ? -dx : dx)))
    : node.width;
  const height = vertical
    ? Math.max(8, Math.min(10000, size.height + (top ? -dy : dy)))
    : node.height;
  const next = {
    ...node,
    width,
    height,
    x:
      resizeWidth && left && (mode === "canvas" || isRoot)
        ? node.x + size.width - width
        : node.x,
    y:
      vertical && top && (mode === "canvas" || isRoot)
        ? node.y + size.height - height
        : node.y,
  };
  if (mode !== "canvas")
    next.layout = {
      ...node.layout,
      ...(resizeWidth && canWidth ? { width: `${width}px` } : {}),
      ...(vertical ? { height: `${height}px` } : {}),
    };
  return next;
}
