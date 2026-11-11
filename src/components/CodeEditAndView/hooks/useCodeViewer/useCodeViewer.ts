import { useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import type { CodeViewerProps } from "../../CodeViewer/CodeViewer.types";
import { createEditor } from "./code-editor.js";
import type { EditorConfig, EditorEngine } from "./code-editor.js";

const emptyDiagnostics: NonNullable<CodeViewerProps["diagnostics"]> = [];
export const useCodeViewer = (props: CodeViewerProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLCanvasElement>(null);
  const engine = useRef<EditorEngine | null>(null);
  const latest = useRef(props);
  latest.current = props;
  const [viewport, setViewport] = useState({ top: 0, height: 1, pixels: 0, compact: false });
  const config = (): EditorConfig => {
    const p = latest.current;
    return {
      code: p.code, language: p.language ?? "tsx",
      editable: p.mode === "edit", disabled: p.disabled ?? false,
      lineNumbers: p.showLineNumbers ?? true, startLine: p.startLine ?? 1,
      tabSize: Math.max(1, Math.min(16, Math.floor(p.tabSize ?? 2))),
      label: p["aria-label"] ?? (p.mode === "edit" ? "Code editor" : "Code"),
      diagnostics: p.diagnostics ?? emptyDiagnostics,
      onChange: code => latest.current.handleChange?.({ code }, "code-change", latest.current),
      onNavigate: (line, type) => latest.current.handleClick?.({ line }, type, latest.current),
      onViewport: (top, total, height) => {
        const next = {
          top: total ? top / total : 0,
          height: total ? Math.min(1, height / total) : 1,
          pixels: Math.min(height, rootRef.current?.clientHeight ?? height),
          compact: (rootRef.current?.clientWidth ?? 0) <= 500,
        };
        setViewport(previous =>
          previous.top === next.top && previous.height === next.height &&
          previous.pixels === next.pixels && previous.compact === next.compact
            ? previous : next);
      },
    };
  };
  useLayoutEffect(() => {
    if (!editorRef.current) return;
    engine.current = createEditor(editorRef.current, config());
    return () => { engine.current?.destroy(); engine.current = null; };
  }, []);
  useLayoutEffect(() => { engine.current?.configure(config()); });
  useLayoutEffect(() => {
    if (props.activeLine !== undefined) engine.current?.navigate(props.activeLine);
  }, [props.activeLine, props.mode, props.startLine]);
  useLayoutEffect(() => {
    const canvas = mapRef.current;
    if (!canvas) return;
    const draw = () => {
      const width = canvas.clientWidth, height = canvas.clientHeight;
      if (!width || !height) return;
      const ratio = globalThis.devicePixelRatio || 1;
      canvas.width = Math.ceil(width * ratio);
      canvas.height = Math.ceil(height * ratio);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(ratio, ratio);
      context.fillStyle = getComputedStyle(canvas).color;
      const lines = engine.current?.overview(Math.ceil(height)) ?? [];
      lines.forEach((text, index) => {
        let column = 0;
        for (const char of text) {
          if (column * 1.5 >= width) break;
          if (char === "\t") column += Math.max(1, props.tabSize ?? 2) - column % Math.max(1, props.tabSize ?? 2);
          else {
            if (char !== " ") context.fillRect(column * 1.5, index * height / lines.length, 1.5, Math.max(1, height / lines.length));
            column++;
          }
        }
      });
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [props.code, props.tabSize, props.showMinimap, viewport.pixels, viewport.compact]);
  const fraction = viewport.top / Math.max(0.0001, 1 - viewport.height);
  const onMinimapPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (event.type === "pointermove" && event.buttons !== 1) return;
    if (event.type === "pointerdown") event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    engine.current?.scroll(Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height))));
  };
  const onMinimapKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = viewport.height / Math.max(0.0001, 1 - viewport.height);
    const next = event.key === "Home" ? 0 : event.key === "End" ? 1
      : event.key === "PageDown" ? fraction + step : event.key === "PageUp" ? fraction - step
      : event.key === "ArrowDown" ? fraction + step / 10 : event.key === "ArrowUp" ? fraction - step / 10 : undefined;
    if (next === undefined) return;
    event.preventDefault();
    engine.current?.scroll(Math.max(0, Math.min(1, next)));
  };
  return { rootRef, editorRef, mapRef, viewport, fraction, onMinimapPointer, onMinimapKey };
};
