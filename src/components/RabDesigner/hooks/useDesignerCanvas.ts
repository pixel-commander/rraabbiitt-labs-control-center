import { resizeElement } from "../js/resize";
import { isHtml, allowsWidth } from "../js/htmlModel";
import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { DesignerCanvasProps } from "../components/DesignerCanvas/DesignerCanvas.types";
import type {
  DesignerDocument,
  DesignerElement,
  DesignerView,
} from "../RABDesigner.types";
import { bounds, locate, newElement, updateNodes } from "../js/document";
const clamp = (v: number) => Math.max(0.1, Math.min(4, v));
type Gesture = {
  mode: "pan" | "draw" | "move" | "resize";
  startX: number;
  startY: number;
  doc: DesignerDocument;
  view: DesignerView;
  node?: DesignerElement;
  parent?: DesignerElement;
  edge?: string;
  draft?: DesignerDocument;
  size?: { width: number; height: number };
  isRoot?: boolean;
};
export function useDesignerCanvas(props: DesignerCanvasProps) {
  const root = useRef<HTMLDivElement>(null),
    latest = useRef(props);
  latest.current = props;
  const gesture = useRef<Gesture | undefined>(undefined),
    space = useRef(false);
  const zoom = (scale: number, cx?: number, cy?: number) => {
    const el = root.current;
    if (!el) return;
    const p = latest.current,
      v = p.view,
      rect = el.getBoundingClientRect();
    const x = cx ?? rect.width / 2,
      y = cy ?? rect.height / 2,
      k = clamp(scale);
    p.handleView(
      {
        scale: k,
        x: x - ((x - v.x) * k) / v.scale,
        y: y - ((y - v.y) * k) / v.scale,
      },
      "view",
    );
  };
  const fit = () => {
    const el = root.current;
    if (!el) return;
    const b = bounds(
        isHtml(latest.current.data)
          ? latest.current.data.children.map((n) => ({ ...n, children: [] }))
          : latest.current.data.children,
      ),
      w = el.clientWidth,
      h = el.clientHeight;
    const scale = clamp(Math.min((w - 120) / b.width, (h - 150) / b.height, 1));
    latest.current.handleView(
      {
        scale,
        x: (w - b.width * scale) / 2 - b.x * scale,
        y: 70 + (h - 100 - b.height * scale) / 2 - b.y * scale,
      },
      "view",
    );
  };
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    latest.current.handleReady(
      {
        fit,
        zoom,
        cancel: () => {
          handlePointerCancel();
          root.current?.focus();
        },
      },
      "ready",
    );
    const wheel = (e: WheelEvent) => {
      if ((e.target as Element).closest("[data-canvas-controls]")) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const delta =
        e.deltaY *
        (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1);
      zoom(
        latest.current.view.scale * Math.exp(-delta * 0.0015),
        e.clientX - r.left,
        e.clientY - r.top,
      );
    };
    const keydown = (e: KeyboardEvent) => {
      if (
        (e.target as Element).closest(
          "input,textarea,select,button,a,[contenteditable],dialog,[data-canvas-controls]",
        )
      )
        return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        latest.current.handleAction({}, "escape");
        return;
      }
      const direction: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      if (direction[e.key]) {
        const p = latest.current,
          found = locate(p.data.children, p.selected);
        if (found && p.data.mode !== "view") {
          e.preventDefault();
          if (
            isHtml(p.data) &&
            !p.data.children.some((n) => n.id === found.node.id)
          )
            return;
          const [dx, dy] = direction[e.key],
            step = e.shiftKey ? 10 : 1;
          p.handleChange(
            {
              ...p.data,
              children: updateNodes(p.data.children, found.node.id, {
                x: found.node.x + dx * step,
                y: found.node.y + dy * step,
              }),
            },
            "change",
          );
        }
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        space.current = true;
        el.style.cursor = "grab";
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        latest.current.handleAction({}, "delete");
      }
      const tools: Record<string, string> = {
        v: "select",
        r: "box",
        t: "text",
        h: "hand",
      };
      if (!e.ctrlKey && !e.metaKey && tools[e.key])
        latest.current.handleAction({ value: tools[e.key] }, "tool");
    };
    const keyup = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        space.current = false;
        el.style.cursor = "";
      }
    };
    const blur = () => {
      space.current = false;
      el.style.cursor = "";
    };
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("keydown", keydown);
    el.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    return () => {
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("keydown", keydown);
      el.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
    };
  }, []);
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.button !== 1) return;
    const el = root.current!,
      target = event.target as HTMLElement;
    if (target.closest("[data-canvas-controls]")) return;
    const p = latest.current,
      rect = el.getBoundingClientRect(),
      px = event.clientX - rect.left,
      py = event.clientY - rect.top;
    el.focus();
    event.preventDefault();
    el.setPointerCapture(event.pointerId);
    const id = Number(target.closest("[data-node]")?.getAttribute("data-node")),
      found = locate(p.data.children, id);
    const inGrid =
      (isHtml(p.data) &&
        !!target.closest("[data-node]")?.hasAttribute("data-flow")) ||
      !!target
        .closest("[data-node]")
        ?.parentElement?.matches("[data-cols],[data-rows]");
    const edge =
      target.closest("[data-resize]")?.getAttribute("data-resize") ?? undefined;
    const mode =
      p.tool === "hand" || space.current || event.button === 1
        ? "pan"
        : p.data.mode === "view"
          ? undefined
          : edge
            ? "resize"
            : p.tool === "box" || p.tool === "text"
              ? "draw"
              : found && !inGrid
                ? "move"
                : !found && p.autoMode
                  ? "pan"
                  : undefined;
    if (mode === "pan" && !found && p.tool === "select")
      p.handleClick({}, "select");
    if (!mode) {
      p.handleClick(found ? { id: found.node.id } : {}, "select");
      return;
    }
    const parentElement = target.closest("[data-node-type=box]");
    const parent =
      mode === "draw"
        ? locate(
            p.data.children,
            Number(parentElement?.getAttribute("data-node")),
          )
        : undefined;
    const node =
      mode === "draw"
        ? newElement(
            p.tool === "text" ? "text" : "box",
            (px - p.view.x) / p.view.scale - (parent?.x ?? 0),
            (py - p.view.y) / p.view.scale - (parent?.y ?? 0),
          )
        : found?.node;
    const isRoot = !!node && p.data.children.some((n) => n.id === node.id);
    const measured = target.closest("[data-node]")?.getBoundingClientRect(),
      frame = target.closest("[data-editor-frame]")?.getBoundingClientRect();
    const size =
      measured && node
        ? {
            width:
              (isRoot && !allowsWidth(p.data.mode, node) && frame
                ? frame.width
                : measured.width) / p.view.scale,
            height: measured.height / p.view.scale,
          }
        : undefined;
    gesture.current = {
      size,
      isRoot,
      mode,
      startX: px,
      startY: py,
      doc: p.data,
      view: p.view,
      node,
      parent: parent?.node,
      edge,
    };
    if (node) p.handleClick({ id: node.id }, "select");
  };
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || !root.current) return;
    const rect = root.current.getBoundingClientRect(),
      dx = event.clientX - rect.left - g.startX,
      dy = event.clientY - rect.top - g.startY,
      p = latest.current;
    if (g.mode === "pan") {
      p.handleView({ ...g.view, x: g.view.x + dx, y: g.view.y + dy }, "view");
      return;
    }
    const n = g.node!;
    const x = dx / g.view.scale,
      y = dy / g.view.scale;
    let next: DesignerElement;
    if (g.mode !== "draw" && x === 0 && y === 0) next = n;
    else if (g.mode === "draw")
      next = {
        ...n,
        x: n.x + Math.min(0, x),
        y: n.y + Math.min(0, y),
        width: Math.max(1, Math.abs(x)),
        height: Math.max(1, Math.abs(y)),
      };
    else if (g.mode === "move") next = { ...n, x: n.x + x, y: n.y + y };
    else
      next = resizeElement(
        n,
        g.size ?? { width: n.width, height: n.height },
        g.edge ?? "se",
        x,
        y,
        g.doc.mode ?? "canvas",
        g.isRoot,
      );
    const data =
      next === n && g.mode !== "draw"
        ? g.doc
        : {
            ...g.doc,
            children:
              g.mode === "draw"
                ? g.parent
                  ? updateNodes(g.doc.children, g.parent.id, {
                      children: [...g.parent.children, next],
                    })
                  : [...g.doc.children, next]
                : updateNodes(g.doc.children, n.id, next),
          };
    g.draft = data;
    p.handlePreview(data, "preview");
  };
  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g) return;
    gesture.current = undefined;
    if (root.current?.hasPointerCapture(event.pointerId))
      root.current.releasePointerCapture(event.pointerId);
    if (g.mode === "pan") return;
    let next = g.draft;
    if (g.mode === "draw" && !next && g.node?.type === "text")
      next = {
        ...g.doc,
        children: g.parent
          ? updateNodes(g.doc.children, g.parent.id, {
              children: [...g.parent.children, g.node],
            })
          : [...g.doc.children, g.node],
      };
    if (next && next !== g.doc) latest.current.handleChange(next, "change");
    if (g.mode === "draw")
      latest.current.handleAction({ value: "select" }, "tool");
  };
  const handlePointerCancel = () => {
    const g = gesture.current;
    gesture.current = undefined;
    if (g) {
      latest.current.handlePreview(g.doc, "preview");
      latest.current.handleView(g.view, "view");
    }
  };
  return {
    root,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  };
}
