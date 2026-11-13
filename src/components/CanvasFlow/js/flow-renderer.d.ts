import type { FlowData, FlowPoint, FlowSelection } from "../CanvasFlow.types";

type View = FlowPoint & { z: number };

export const createFlowRenderer: (canvas: HTMLCanvasElement) => {
  draw(data: FlowData, selection: FlowSelection | null, view: View, animate: boolean): void;
  pick(data: FlowData, point: FlowPoint, view: View): (FlowSelection & { resize?: boolean }) | null;
} | null;
