import { useRef, useState, type PointerEvent } from "react";
import type {
  GridDesignerProps,
  GridBox,
  GridSave,
  Track,
} from "../../GridDesigner.types";
import {
  clamp,
  clampBox,
  normalizeTracks,
  placed,
  atomCss,
  validateGridState,
} from "../../js/geometry/geometry";
type Gesture = {
  kind: "draw" | "move" | "resize";
  pointer: number;
  row: number;
  col: number;
  source?: GridBox;
};
export const useGridDesigner = (props: GridDesignerProps) => {
  const { data, disabled = false } = props;
  const canvas = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const [draft, setDraft] = useState<GridBox | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [device, setDevice] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const change = (next: typeof data) => {
    if (!disabled) props.handleChange?.(next, "grid-designer", props);
  };
  const cellAt = (x: number, y: number) => {
    const el = canvas.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    // Read the actual CSS track sizes: manual/auto tracks need nonuniform hit testing.
    const style = getComputedStyle(el);
    const index = (position: number, tracks: string, count: number) => {
      const sizes = tracks.split(" ").map(parseFloat);
      let total = 0;
      for (let i = 0; i < sizes.length; i++) {
        total += sizes[i];
        if (position < total) return i + 1;
      }
      return count;
    };
    return {
      row: clamp(
        index(y - rect.top, style.gridTemplateRows, data.rows),
        1,
        data.rows,
      ),
      col: clamp(
        index(x - rect.left, style.gridTemplateColumns, data.cols),
        1,
        data.cols,
      ),
    };
  };
  const begin = (
    event: PointerEvent<HTMLElement>,
    kind: Gesture["kind"],
    source?: GridBox,
  ) => {
    if (
      disabled ||
      event.button !== 0 ||
      (kind === "draw" && event.target !== event.currentTarget)
    )
      return;
    const cell = cellAt(event.clientX, event.clientY);
    if (!cell) return;
    event.preventDefault();
    event.stopPropagation();
    canvas.current?.setPointerCapture(event.pointerId);
    gesture.current = {
      kind,
      pointer: event.pointerId,
      row: cell.row,
      col: cell.col,
      source,
    };
    setBlocked(false);
    if (source) props.handleSelect?.(source.id, "grid-box", props);
    else
      setDraft({
        id: Math.max(0, ...data.boxes.map((b) => b.id)) + 1,
        r1: cell.row,
        c1: cell.col,
        r2: cell.row,
        c2: cell.col,
      });
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const action = gesture.current;
    if (!action || action.pointer !== event.pointerId || disabled) return;
    const cell = cellAt(event.clientX, event.clientY);
    if (!cell) return;
    let next: GridBox;
    if (action.kind === "draw")
      next = {
        id: Math.max(0, ...data.boxes.map((b) => b.id)) + 1,
        r1: action.row,
        c1: action.col,
        r2: cell.row,
        c2: cell.col,
      };
    else {
      const source = action.source!;
      if (action.kind === "resize")
        next = { ...source, r2: cell.row, c2: cell.col };
      else {
        const h = source.r2 - source.r1,
          w = source.c2 - source.c1;
        const r1 = clamp(source.r1 + cell.row - action.row, 1, data.rows - h),
          c1 = clamp(source.c1 + cell.col - action.col, 1, data.cols - w);
        next = { ...source, r1, c1, r2: r1 + h, c2: c1 + w };
      }
    }
    setDraft(next);
    setBlocked(
      !placed(next, data.boxes, data.rows, data.cols, action.source?.id),
    );
  };
  const cancel = () => {
    gesture.current = null;
    setDraft(null);
    setBlocked(false);
  };
  const end = (event: PointerEvent<HTMLDivElement>) => {
    const action = gesture.current;
    if (!action || action.pointer !== event.pointerId) return;
    if (draft && !disabled) {
      const box = placed(
        draft,
        data.boxes,
        data.rows,
        data.cols,
        action.source?.id,
      );
      if (box) {
        change({
          ...data,
          boxes: action.source
            ? data.boxes.map((b) => (b.id === box.id ? box : b))
            : [...data.boxes, box],
        });
        props.handleSelect?.(box.id, "grid-box", props);
      }
    }
    cancel();
  };
  const resizeGrid = (rows: number, cols: number) => {
    if (
      !Number.isInteger(rows) ||
      !Number.isInteger(cols) ||
      rows < 1 ||
      cols < 1
    )
      return;
    const next = {
      ...data,
      rows,
      cols,
      rowTracks: normalizeTracks(data.rowTracks, rows),
      colTracks: normalizeTracks(data.colTracks, cols),
      boxes: data.boxes.map((b) => clampBox(b, rows, cols)),
    };
    const problem = validateGridState(next);
    setStatus(problem);
    if (!problem) change(next);
  };
  const updateTrack = (
    axis: "rowTracks" | "colTracks",
    index: number,
    patch: Partial<Track>,
  ) => {
    if (patch.manual && !CSS.supports("grid-template-columns", patch.manual))
      return;
    change({
      ...data,
      [axis]: data[axis].map((track, i) =>
        i === index ? { ...track, ...patch } : track,
      ),
    });
  };
  const save = async (form: HTMLFormElement) => {
    if (disabled || busy || !props.handleSave) return;
    const values = new FormData(form),
      name = String(values.get("name") ?? "").trim();
    const problem = validateGridState(data);
    if (!name || problem) {
      setStatus(problem || "Name is required.");
      return;
    }
    const payload: GridSave = {
      name,
      description: String(values.get("description") ?? ""),
      data,
      css: atomCss(name, data),
    };
    setBusy(true);
    setStatus("");
    try {
      await props.handleSave(payload, "grid-designer", props);
      setStatus("Saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };
  return {
    canvas,
    draft,
    blocked,
    device,
    setDevice,
    saveOpen,
    setSaveOpen,
    status,
    busy,
    change,
    begin,
    move,
    end,
    cancel,
    resizeGrid,
    updateTrack,
    save,
  };
};
