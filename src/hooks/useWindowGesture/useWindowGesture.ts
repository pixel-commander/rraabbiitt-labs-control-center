import { useEffect, useLayoutEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export const useWindowGesture = (
  root: RefObject<HTMLDivElement | null>,
  options: {
    rect: WindowRect;
    viewport?: boolean;
    handleChange: (rect: WindowRect, type: "move" | "resize") => void;
    handleEnd?: (rect: WindowRect, type: "move" | "resize") => void;
  },
) => {
  const latest = useRef(options);
  latest.current = options;
  const dispose = useRef<() => void>(() => {});
  useLayoutEffect(() => {
    if (!root.current) dispose.current();
  });
  useEffect(() => () => dispose.current(), []);
  const begin = (
    event: ReactPointerEvent<HTMLElement>,
    type: "move" | "resize",
    initial?: WindowRect,
  ) => {
    if (
      event.button !== 0 ||
      !event.isPrimary ||
      (event.target as HTMLElement).closest("button,input,a,textarea,select")
    )
      return;
    const box = root.current;
    if (!box) return;
    event.preventDefault();
    dispose.current();
    const view = box.ownerDocument.defaultView!;
    const start = { ...(initial ?? latest.current.rect) };
    const sx = event.clientX,
      sy = event.clientY,
      pointer = event.pointerId;
    const target = event.currentTarget;
    const before = box.style.userSelect;
    box.style.userSelect = "none";
    target.setPointerCapture(pointer);
    let result = start;
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      const config = latest.current;
      const parent = box.offsetParent as HTMLElement | null;
      const width = config.viewport
        ? view.innerWidth
        : (parent?.clientWidth ?? view.innerWidth);
      const height = config.viewport
        ? view.innerHeight
        : (parent?.clientHeight ?? view.innerHeight);
      const dx = e.clientX - sx,
        dy = e.clientY - sy;
      result =
        type === "move"
          ? {
              ...start,
              x: Math.max(
                0,
                Math.min(Math.max(0, width - start.width), start.x + dx),
              ),
              y: Math.max(
                0,
                Math.min(Math.max(0, height - start.height), start.y + dy),
              ),
            }
          : {
              ...start,
              width: Math.min(
                Math.max(0, width - start.x),
                Math.max(120, start.width + dx),
              ),
              height: Math.min(
                Math.max(0, height - start.y),
                Math.max(80, start.height + dy),
              ),
            };
      config.handleChange(result, type);
    };
    const cleanup = () => {
      view.removeEventListener("pointermove", move);
      view.removeEventListener("pointerup", end);
      view.removeEventListener("pointercancel", cancel);
      target.removeEventListener("lostpointercapture", cancel);
      if (target.hasPointerCapture(pointer))
        target.releasePointerCapture(pointer);
      box.style.userSelect = before;
      dispose.current = () => {};
    };
    const end = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      cleanup();
      latest.current.handleEnd?.(result, type);
    };
    const cancel = (e: PointerEvent) => {
      if (e.pointerId === pointer) cleanup();
    };
    dispose.current = cleanup;
    view.addEventListener("pointermove", move);
    view.addEventListener("pointerup", end);
    view.addEventListener("pointercancel", cancel);
    target.addEventListener("lostpointercapture", cancel);
  };
  return { begin };
};
