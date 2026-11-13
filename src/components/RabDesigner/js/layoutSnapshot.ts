import type {
  DesignerDocument,
  DesignerElement,
} from "../RABDesigner.types.ts";
import { isHtml } from "./htmlModel.ts";
export interface LayoutBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
export function snapshotLayout(
  data: DesignerDocument,
  boxes: Map<number, LayoutBox>,
): DesignerDocument {
  if (isHtml(data)) return data;
  const visit = (nodes: DesignerElement[]): DesignerElement[] => {
    const next = nodes.map((node) => {
      const box = boxes.get(node.id),
        children = visit(node.children);
      const changed =
        box &&
        (["x", "y", "width", "height"] as const).some(
          (key) => box[key] !== node[key],
        );
      return changed || children !== node.children
        ? { ...node, ...box, children }
        : node;
    });
    return next.some((node, index) => node !== nodes[index]) ? next : nodes;
  };
  const children = visit(data.children);
  return children === data.children ? data : { ...data, children };
}
export function captureLayout(
  data: DesignerDocument,
  scale: number,
): DesignerDocument {
  if (isHtml(data)) return data;
  const boxes = new Map<number, LayoutBox>();
  const visit = (nodes: DesignerElement[], parent?: HTMLElement) =>
    nodes.forEach((node) => {
      const element = document.querySelector<HTMLElement>(
        `[aria-label="Design canvas"] [data-node="${node.id}"]`,
      );
      if (!element) return;
      const rect = element.getBoundingClientRect(),
        parentRect = parent?.getBoundingClientRect();
      // Grid children report their actual track placement, not their old freeform coordinates.
      boxes.set(node.id, {
        x: parentRect
          ? (rect.left - parentRect.left) / scale - (parent?.clientLeft ?? 0)
          : node.x,
        y: parentRect
          ? (rect.top - parentRect.top) / scale - (parent?.clientTop ?? 0)
          : node.y,
        width: parseFloat(getComputedStyle(element).width),
        height: parseFloat(getComputedStyle(element).height),
      });
      visit(node.children, element);
    });
  visit(data.children);
  return snapshotLayout(data, boxes);
}
