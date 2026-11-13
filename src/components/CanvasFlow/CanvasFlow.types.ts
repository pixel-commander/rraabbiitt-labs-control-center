import type { HandlerKey, HouseKeys } from "../../HouseKeys.types";

export type FlowId = string | number;
export type FlowPoint = { x: number; y: number };
export type FlowNode = FlowPoint & {
  id: FlowId;
  title?: string;
  sub?: string;
  type?: string;
  w?: number;
  h?: number;
  icon?: string;
  plain?: string;
  color?: string;
  box?: string;
};
export type FlowEdge = {
  id?: FlowId;
  from: FlowId;
  to: FlowId;
  to_type?: "node" | "edge";
  label?: string;
  note?: string;
  type?: string;
  color?: string;
  route?: "ortho" | "curve" | "straight" | "elastic" | "bolt";
  fx?: "none" | "pulse" | "flow" | "crackle";
  routeSettings?: Partial<Record<"slack" | "gravity" | "damping" | "chaos" | "branches" | "flicker" | "glow", number>>;
  effectSettings?: Partial<Record<"speed" | "radius" | "glow" | "width" | "dash" | "spacing" | "cycle" | "arcs" | "sparks", number>>;
};
export type FlowShape = FlowPoint & { id: FlowId; r: number; title?: string; type?: string; plain?: string };
export type FlowNote = FlowPoint & { id: FlowId; text: string };
export type FlowKind = { color?: string; label?: string; dash?: number[]; weight?: number; mute?: boolean; loud?: boolean };
export type FlowData = {
  title?: string;
  subtitle?: string;
  types?: Record<string, FlowKind>;
  kinds?: Record<string, FlowKind>;
  nodes: readonly FlowNode[];
  edges: readonly FlowEdge[];
  shapes?: readonly FlowShape[];
  notes?: readonly FlowNote[];
};
export type FlowSelection = { type: "node" | "edge" | "shape" | "note"; id: FlowId };

export interface CanvasFlowProps extends HouseKeys {
  data: FlowData;
  selected?: FlowSelection | null;
  className?: string;
  handleChange?: HandlerKey<FlowData, "canvas-flow", void, CanvasFlowProps>;
  handleSelect?: HandlerKey<FlowSelection | null, "canvas-flow", void, CanvasFlowProps>;
  handleSave?: HandlerKey<FlowData, "canvas-flow", void, CanvasFlowProps>;
}
