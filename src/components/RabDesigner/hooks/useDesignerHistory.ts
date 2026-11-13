import { useRef, useState } from "react";
import type { HandlerKey } from "../../../HouseKeys.types";
import type { DesignerDocument, DesignerProps } from "../RABDesigner.types";
import { newDocument } from "../js/document";
import { createHistory, transitionHistory } from "../js/history";
import type { DesignerHistoryAction } from "../js/history";
export function useDesignerHistory() {
  const [state, setState] = useState(() => createHistory(newDocument()));
  const current = useRef(state);
  const transition = (action: DesignerHistoryAction) => {
    const next = transitionHistory(current.current, action);
    current.current = next;
    setState(next);
    return next;
  };
  const handleChange: DesignerProps["handleChange"] = (data) => {
    if (data) transition({ type: "commit", data });
  };
  const handlePreview: DesignerProps["handlePreview"] = (data) => {
    if (data) transition({ type: "preview", data });
  };
  const handleHistory: HandlerKey<undefined, "undo" | "redo", void> = (
    _,
    type,
  ) => {
    if (type) transition({ type });
  };
  const handleAdopt: HandlerKey<DesignerDocument, "adopt", void> = (data) => {
    if (data) transition({ type: "reset", data });
  };
  return {
    state,
    current,
    data: state.preview ?? state.present.data,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    handleChange,
    handlePreview,
    handleHistory,
    handleAdopt,
  };
}
export type DesignerHistory = ReturnType<typeof useDesignerHistory>;
