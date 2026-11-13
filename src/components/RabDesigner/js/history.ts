import type { DesignerDocument } from "../RABDesigner.types.ts";
import { synchronizeDesign } from "./htmlModel.ts";
export interface DesignerRevision {
  data: DesignerDocument;
  revision: number;
}
export interface DesignerHistoryState {
  present: DesignerRevision;
  preview?: DesignerDocument;
  past: DesignerRevision[];
  future: DesignerRevision[];
  nextRevision: number;
  session: number;
}
export type DesignerHistoryAction =
  | { type: "commit" | "preview" | "reset"; data: DesignerDocument }
  | { type: "undo" | "redo" };
export function createHistory(data: DesignerDocument): DesignerHistoryState {
  return {
    present: { data, revision: 0 },
    past: [],
    future: [],
    nextRevision: 1,
    session: 0,
  };
}
export function transitionHistory(
  state: DesignerHistoryState,
  action: DesignerHistoryAction,
): DesignerHistoryState {
  switch (action.type) {
    case "commit": {
      if (action.data === state.present.data)
        return state.preview ? { ...state, preview: undefined } : state;
      const data = synchronizeDesign(state.present.data, action.data);
      return {
        ...state,
        present: { data, revision: state.nextRevision },
        preview: undefined,
        past: [...state.past, state.present].slice(-60),
        future: [],
        nextRevision: state.nextRevision + 1,
      };
    }
    case "preview":
      return {
        ...state,
        preview:
          action.data === state.present.data
            ? undefined
            : synchronizeDesign(state.present.data, action.data),
      };
    case "reset":
      return {
        present: { data: action.data, revision: state.nextRevision },
        past: [],
        future: [],
        nextRevision: state.nextRevision + 1,
        session: state.session + 1,
      };
    case "undo": {
      const previous = state.past.at(-1);
      if (!previous)
        return state.preview ? { ...state, preview: undefined } : state;
      return {
        ...state,
        present: previous,
        preview: undefined,
        past: state.past.slice(0, -1),
        future: [...state.future, state.present],
      };
    }
    case "redo": {
      const next = state.future.at(-1);
      if (!next)
        return state.preview ? { ...state, preview: undefined } : state;
      return {
        ...state,
        present: next,
        preview: undefined,
        past: [...state.past, state.present].slice(-60),
        future: state.future.slice(0, -1),
      };
    }
  }
}
export const hasUnsavedRevision = (
  state: DesignerHistoryState,
  savedRevision: number | undefined,
) => state.present.revision !== savedRevision || state.preview !== undefined;
