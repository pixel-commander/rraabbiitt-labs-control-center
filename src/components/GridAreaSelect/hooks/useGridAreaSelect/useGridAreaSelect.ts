import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import type {
  GridArea,
  GridLayout,
  GridAreaSelectProps,
} from "../../GridAreaSelect.types";
import {
  overlapsAny,
  resolveResize,
  resolveSnap,
} from "../../js/resolve-layout/resolve-layout";
type Gesture = {
  pointer: number;
  kind: "create" | "move" | "resize";
  index: number;
  start: { r: number; c: number };
  original: GridArea;
  edge: string;
  layout: GridLayout;
};
export const useGridAreaSelect = (props: GridAreaSelectProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const candidateRef = useRef<GridArea | null>(null);
  const [preview, setPreview] = useState<GridArea | null>(null);
  const { layout, disabled = false, maxRowSpan = 0, snap = false } = props;
  const cols = Math.max(1, Math.floor(layout.cols) || 1),
    rows = Math.max(1, Math.floor(layout.rows) || 1);
  const point = (event: PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    return {
      c: Math.max(
        1,
        Math.min(
          cols,
          Math.floor((event.clientX - rect.left) / (rect.width / cols)) + 1,
        ),
      ),
      r: Math.max(
        1,
        Math.min(
          rows,
          Math.floor((event.clientY - rect.top) / (rect.height / rows)) + 1,
        ),
      ),
    };
  };
  const show = (area: GridArea | null) => {
    candidateRef.current = area;
    setPreview(area);
  };
  const begin = (
    event: PointerEvent,
    kind: Gesture["kind"],
    index = -1,
    edge = "",
  ) => {
    if (disabled || event.button !== 0 || !event.isPrimary || gesture.current)
      return;
    event.preventDefault();
    event.stopPropagation();
    const start = point(event);
    const original =
      index < 0
        ? { id: 0, r1: start.r, c1: start.c, rows: 1, cols: 1 }
        : layout.areas[index];
    gesture.current = {
      pointer: event.pointerId,
      kind,
      index,
      start,
      original,
      edge,
      layout,
    };
    ref.current!.setPointerCapture(event.pointerId);
    show(original);
  };
  const move = (event: PointerEvent) => {
    const current = gesture.current;
    if (
      !current ||
      event.pointerId !== current.pointer ||
      current.layout !== layout ||
      disabled
    )
      return;
    const cell = point(event),
      a = current.original;
    const next = { ...a };
    if (current.kind === "create") {
      next.r1 = Math.min(cell.r, current.start.r);
      next.c1 = Math.min(cell.c, current.start.c);
      next.rows = Math.abs(cell.r - current.start.r) + 1;
      next.cols = Math.abs(cell.c - current.start.c) + 1;
    } else if (current.kind === "move") {
      next.r1 = Math.max(
        1,
        Math.min(rows - a.rows + 1, a.r1 + cell.r - current.start.r),
      );
      next.c1 = Math.max(
        1,
        Math.min(cols - a.cols + 1, a.c1 + cell.c - current.start.c),
      );
    } else {
      let bottom = a.r1 + a.rows - 1,
        right = a.c1 + a.cols - 1;
      if (current.edge.includes("n")) next.r1 = Math.min(bottom, cell.r);
      if (current.edge.includes("w")) next.c1 = Math.min(right, cell.c);
      if (current.edge.includes("s")) bottom = Math.max(a.r1, cell.r);
      if (current.edge.includes("e")) right = Math.max(a.c1, cell.c);
      next.rows = bottom - next.r1 + 1;
      next.cols = right - next.c1 + 1;
    }
    if (maxRowSpan > 0 && current.kind !== "move")
      next.rows = Math.min(next.rows, maxRowSpan);
    show(next);
  };
  const resolve = (current: Gesture, candidate: GridArea) =>
    (snap && current.kind === "resize" ? resolveSnap : resolveResize)(
      layout.areas,
      current.index,
      candidate,
      cols,
      rows,
    );
  const finish = (event: PointerEvent, cancel = false) => {
    const current = gesture.current;
    if (!current || event.pointerId !== current.pointer) return;
    gesture.current = null;
    const candidate = candidateRef.current;
    show(null);
    if (ref.current?.hasPointerCapture(event.pointerId))
      ref.current.releasePointerCapture(event.pointerId);
    if (cancel || disabled || !candidate || current.layout !== layout) return;
    if (current.kind === "create") {
      if (!overlapsAny(candidate, layout.areas)) {
        const { id: _id, ...area } = candidate;
        props.handleCreate?.(area, "create", { ...props });
      }
      return;
    }
    const result = resolve(current, candidate);
    if (
      !result.blocked &&
      !result.areas.some((area, index) =>
        overlapsAny(
          area,
          result.areas.filter((_, other) => other !== index),
        ),
      )
    )
      props.handleChange?.({ ...layout, areas: result.areas }, current.kind, {
        ...props,
      });
  };
  const remove = (area: GridArea) => {
    if (disabled) return;
    props.handleChange?.(
      { ...layout, areas: layout.areas.filter((item) => item.id !== area.id) },
      "remove",
      { ...props },
    );
    if (props.selected === area.id)
      props.handleClick?.(null, "select", { ...props });
  };
  const active = gesture.current;
  const blocked =
    preview && active && active.layout === layout
      ? active.kind === "create"
        ? overlapsAny(preview, layout.areas)
        : resolve(active, preview).blocked
      : false;
  return { ref, cols, rows, preview, blocked, begin, move, finish, remove };
};
