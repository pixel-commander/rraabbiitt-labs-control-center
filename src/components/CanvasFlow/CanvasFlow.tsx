import type { CanvasFlowProps } from "./CanvasFlow.types";
import { useCanvasFlow } from "./hooks/useCanvasFlow/useCanvasFlow";
import "./css/canvas-flow.css";

export const CanvasFlow = (props: CanvasFlowProps) => {
  const { canvas, pointerDown, pointerMove, pointerEnd } = useCanvasFlow(props);
  return (
    <canvas
      ref={canvas}
      className={["canvas-flow", props.className].filter(Boolean).join(" ")}
      tabIndex={0}
      aria-label={props.title ?? props.data.title ?? "Flow canvas"}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerEnd}
      onPointerCancel={pointerEnd}
      onLostPointerCapture={pointerEnd}
      onKeyDown={(event) => {
        if (event.key === "Escape") props.handleSelect?.(null, "canvas-flow", props);
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s" && props.handleSave) {
          event.preventDefault();
          props.handleSave(props.data, "canvas-flow", props);
        }
      }}
    />
  );
};
