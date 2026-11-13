import { useEffect, useLayoutEffect, useRef } from "react";
import type { PointerEvent } from "react";
import type { CanvasFlowProps, FlowPoint, FlowSelection } from "../../CanvasFlow.types";
import { createFlowRenderer } from "../../js/flow-renderer.js";

type Gesture = {
  pointer: number;
  start: FlowPoint;
  origin: FlowPoint;
  hit: (FlowSelection & { resize?: boolean }) | null;
};

export const useCanvasFlow = (props: CanvasFlowProps) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props);
  const renderer = useRef<ReturnType<typeof createFlowRenderer>>(null);
  const view = useRef({ x: 0, y: 0, z: 1 });
  const gesture = useRef<Gesture | null>(null);

  useLayoutEffect(() => { latest.current = props; }, [props]);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    renderer.current = createFlowRenderer(element);
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const draw = () => {
      const { data, selected } = latest.current;
      const animate = !still.matches && data.edges.some(
        (edge) => (edge.fx && edge.fx !== "none") || edge.route === "elastic" || edge.route === "bolt",
      );
      renderer.current?.draw(data, selected ?? null, view.current, animate);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    const zoom = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const { x, y, z } = view.current;
      const next = Math.max(0.15, Math.min(4, z * Math.exp(-event.deltaY * 0.002)));
      view.current = { x: px - (px - x) * next / z, y: py - (py - y) * next / z, z: next };
    };
    element.addEventListener("wheel", zoom, { passive: false });

    return () => {
      element.removeEventListener("wheel", zoom);
      cancelAnimationFrame(frame);
      renderer.current = null;
    };
  }, []);

  const pointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0 || gesture.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const { x, y, z } = view.current;
    const hit = renderer.current?.pick(props.data, {
      x: (event.clientX - rect.left - x) / z,
      y: (event.clientY - rect.top - y) / z,
    }, view.current) ?? null;
    const item = hit?.type === "node" ? props.data.nodes.find(({ id }) => id === hit.id)
      : hit?.type === "shape" ? props.data.shapes?.find(({ id }) => id === hit.id)
      : hit?.type === "note" ? props.data.notes?.find(({ id }) => id === hit.id) : undefined;
    gesture.current = {
      pointer: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      origin: hit?.resize && item && "r" in item ? { x: item.r, y: 0 }
        : hit?.resize && item && hit.type === "node" ? {
          x: "w" in item ? item.w ?? 190 : 190,
          y: "h" in item ? item.h ?? 56 : 56,
        } : item ?? { x, y },
      hit,
    };
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    props.handleSelect?.(hit ? { type: hit.type, id: hit.id } : null, "canvas-flow", props);
  };

  const pointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const active = gesture.current;
    if (!active || active.pointer !== event.pointerId) return;
    const { hit, origin, start } = active;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!hit) {
      view.current = { ...view.current, x: origin.x + dx, y: origin.y + dy };
      return;
    }
    if (hit.type === "edge" || !props.handleChange) return;
    const { data } = props;
    const { z } = view.current;
    const point = { x: origin.x + dx / z, y: origin.y + dy / z };
    const next = { ...data };
    if (hit.type === "node") next.nodes = data.nodes.map((node) => node.id !== hit.id ? node : {
      ...node, ...(hit.resize ? { w: Math.max(70, point.x), h: Math.max(36, point.y) } : point),
    });
    if (hit.type === "shape") next.shapes = data.shapes?.map((shape) => shape.id !== hit.id ? shape : {
      ...shape, ...(hit.resize ? { r: Math.max(12, point.x) } : point),
    });
    if (hit.type === "note") next.notes = data.notes?.map((note) => note.id !== hit.id ? note : { ...note, ...point });
    props.handleChange(next, "canvas-flow", props);
  };

  const pointerEnd = (event: PointerEvent<HTMLCanvasElement>) => {
    if (gesture.current?.pointer === event.pointerId) gesture.current = null;
  };

  return { canvas, pointerDown, pointerMove, pointerEnd };
};
