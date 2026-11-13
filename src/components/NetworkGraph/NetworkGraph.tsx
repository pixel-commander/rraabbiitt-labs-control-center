import { useEffect, useRef } from "react";
import type { NetworkGraphProps, GraphNode } from "./NetworkGraph.types";
import "./css/network-graph.css";

export const NetworkGraph = ({
  className = "",
  data,
  selected,
  handleSelect,
  handleClick,
  colors = {},
  lineStyle = {},
  initialZoom = 1,
  title = "Network graph",
}: NetworkGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const current = useRef({
    data,
    selected,
    handleSelect,
    handleClick,
    colors,
    lineStyle,
  });
  current.current = {
    data,
    selected,
    handleSelect,
    handleClick,
    colors,
    lineStyle,
  };
  const redraw = useRef<() => void>(() => {});
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let scale = 1,
      offsetX = 0,
      offsetY = 0;
    let hover: GraphNode | undefined;
    let drag:
      | { x: number; y: number; ox: number; oy: number; moved: boolean }
      | undefined;
    let initialized = false;
    const bounds = () => ({
      w: Math.max(400, ...current.current.data.nodes.map((n) => n.x)) + 275,
      h: Math.max(240, ...current.current.data.nodes.map((n) => n.y)) + 70,
    });
    const fit = () => {
      const rect = canvas.getBoundingClientRect(),
        world = bounds();
      scale =
        Math.min((rect.width - 60) / world.w, (rect.height - 60) / world.h) *
        initialZoom;
      offsetX = (rect.width - world.w * scale) / 2;
      offsetY = (rect.height - world.h * scale) / 2;
    };
    const draw = () => {
      const { data, selected, colors, lineStyle } = current.current;
      const skin = getComputedStyle(canvas);
      const palette = {
        node: skin.getPropertyValue("--network-node").trim() || skin.color,
        edge: skin.getPropertyValue("--network-edge").trim() || skin.color,
        label: skin.getPropertyValue("--network-text").trim() || skin.color,
        guide: skin.getPropertyValue("--network-line").trim() || skin.color,
        ...colors,
      };
      const lines = {
        width: 1,
        opacity: 0.9,
        activeWidth: 1.25,
        activeOpacity: 1,
        inactiveOpacity: 0.025,
        ...lineStyle,
      };
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      const byKey = new Map(data.nodes.map((n) => [n.key, n]));
      const focus =
        hover?.key ?? (selected && byKey.has(selected) ? selected : undefined);
      const related = new Set<string>(focus ? [focus] : []);
      data.edges.forEach((e) => {
        if (e.source === focus) related.add(e.target);
        if (e.target === focus) related.add(e.source);
      });
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      ctx.strokeStyle = palette.guide;
      ctx.globalAlpha = 0.5;
      ctx.setLineDash([3 / scale, 8 / scale]);
      ctx.lineWidth = 1 / scale;
      const world = bounds();
      [...new Set(data.nodes.map((n) => n.x))].forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(x, 35);
        ctx.lineTo(x, world.h - 35);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      for (const edge of data.edges) {
        const a = byKey.get(edge.source),
          b = byKey.get(edge.target);
        if (!a || !b) continue;
        const active =
          !!focus && (edge.source === focus || edge.target === focus);
        ctx.globalAlpha = focus
          ? active
            ? lines.activeOpacity
            : lines.inactiveOpacity
          : lines.opacity;
        ctx.strokeStyle = active
          ? (edge.color ?? b.color ?? palette.edge)
          : (edge.color ?? palette.edge);
        ctx.lineWidth = (active ? lines.activeWidth : lines.width) / scale;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.bezierCurveTo(a.x + 300, a.y, b.x - 300, b.y, b.x, b.y);
        ctx.stroke();
      }
      for (const [index, node] of data.nodes.entries()) {
        const active = !focus || related.has(node.key),
          left = node.group === "components";
        ctx.globalAlpha = active ? 1 : 0.15;
        ctx.fillStyle = node.color ?? palette.node;
        ctx.shadowColor = active ? (node.color ?? palette.node) : "transparent";
        ctx.shadowBlur = active ? 10 : 0;
        ctx.beginPath();
        ctx.arc(
          node.x,
          node.y,
          focus && active ? 6.5 : left ? 4.2 : 3.3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.shadowBlur = 0;
        if ((scale > 0.3 && (left || index % 3 === 0)) || node.key === focus) {
          ctx.font = `${Math.max(11, (left ? 12 : 11) / scale)}px Segoe UI`;
          ctx.textAlign = left ? "right" : "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle = palette.label;
          ctx.fillText(
            node.name ?? node.key,
            node.x + (left ? -13 : 12),
            node.y,
            260,
          );
        }
      }
      ctx.restore();
    };
    redraw.current = draw;
    const resize = () => {
      const rect = canvas.getBoundingClientRect(),
        dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!initialized) {
        fit();
        initialized = true;
      }
      draw();
    };
    const nodeAt = (x: number, y: number) => {
      let best: GraphNode | undefined,
        distance = 14 / scale;
      const wx = (x - offsetX) / scale,
        wy = (y - offsetY) / scale;
      for (const node of current.current.data.nodes) {
        const d = Math.hypot(wx - node.x, wy - node.y);
        if (d < distance) {
          best = node;
          distance = d;
        }
      }
      return best;
    };
    const down = (event: PointerEvent) => {
      drag = {
        x: event.clientX,
        y: event.clientY,
        ox: offsetX,
        oy: offsetY,
        moved: false,
      };
      canvas.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (drag) {
        const dx = event.clientX - drag.x,
          dy = event.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
        offsetX = drag.ox + dx;
        offsetY = drag.oy + dy;
        canvas.style.cursor = "grabbing";
      } else {
        hover = nodeAt(event.clientX - rect.left, event.clientY - rect.top);
        canvas.style.cursor = hover ? "pointer" : "grab";
      }
      draw();
    };
    const up = (event: PointerEvent) => {
      if (drag && !drag.moved) {
        const rect = canvas.getBoundingClientRect(),
          node = nodeAt(event.clientX - rect.left, event.clientY - rect.top);
        current.current.handleSelect?.(node, "network-graph");
        if (node) current.current.handleClick?.(node, "network-graph");
      }
      drag = undefined;
      canvas.style.cursor = "grab";
      draw();
    };
    const leave = () => {
      hover = undefined;
      draw();
    };
    const cancel = () => {
      drag = undefined;
      leave();
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect(),
        x = event.clientX - rect.left,
        y = event.clientY - rect.top,
        old = scale;
      scale = Math.min(
        3.2,
        Math.max(0.08, scale * Math.exp(-event.deltaY * 0.001)),
      );
      offsetX = x - (x - offsetX) * (scale / old);
      offsetY = y - (y - offsetY) * (scale / old);
      draw();
    };
    const reset = () => {
      fit();
      draw();
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", cancel);
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("wheel", wheel, { passive: false });
    canvas.addEventListener("dblclick", reset);
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    return () => {
      observer.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("wheel", wheel);
      canvas.removeEventListener("dblclick", reset);
      redraw.current = () => {};
    };
  }, [initialZoom]);
  useEffect(() => {
    redraw.current();
  }, [data, selected, colors, lineStyle]);
  return (
    <div className={["network-graph", className].filter(Boolean).join(" ")}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`${title}. Drag to pan, scroll to zoom, double-click to reset.`}
      />
      {data.nodes.length === 0 && <p>No nodes to display.</p>}
    </div>
  );
};
