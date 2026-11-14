import { useEffect, useRef } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import type { ThreeDDialProps } from "../ThreeDDial.types";
export const useThreeDDial = (props: ThreeDDialProps) => {
  const value = Math.max(0, Math.min(100, Number.isFinite(props.value) ? props.value! : 40));
  const knobRef = useRef<HTMLDivElement>(null);
  const latest = useRef({ props, value });
  latest.current = { props, value };
  const drag = useRef<{ id: number; y: number; value: number } | null>(null);
  const change = (next: number) => {
    const { props } = latest.current;
    if (!props.disabled) props.handleChange?.({ value: Math.max(0, Math.min(100, next)) }, "dial", props);
  };
  useEffect(() => {
    const knob = knobRef.current;
    const wheel = (event: WheelEvent) => {
      if (latest.current.props.disabled || event.deltaY === 0) return;
      event.preventDefault();
      change(latest.current.value + (event.deltaY < 0 ? 2 : -2));
    };
    knob?.addEventListener("wheel", wheel, { passive: false });
    return () => knob?.removeEventListener("wheel", wheel);
  }, []);
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (props.disabled || event.button !== 0) return;
    event.preventDefault(); event.currentTarget.focus();
    drag.current = { id: event.pointerId, y: event.clientY, value };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== event.pointerId) return;
    change(drag.current.value + (drag.current.y - event.clientY) * .55 * (event.shiftKey ? .25 : 1));
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id === event.pointerId) drag.current = null;
  };
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (props.disabled) return;
    const step = event.shiftKey ? 1 : 5;
    const next = ({ ArrowUp: value + step, ArrowRight: value + step, ArrowDown: value - step,
      ArrowLeft: value - step, Home: 0, End: 100 } as Record<string, number>)[event.key];
    if (next === undefined) return;
    event.preventDefault(); change(next);
  };
  return { value, knobRef, pointerDown, pointerMove, pointerUp, keyDown };
};
