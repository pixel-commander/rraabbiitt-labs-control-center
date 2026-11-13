import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";

export interface GraphNode extends HouseKeys {
  key: string;
  x: number;
  y: number;
  group?: string;
  shape?: "circle" | "square";
  type?: string;
  color?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  color?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphColors {
  node?: string;
  edge?: string;
  label?: string;
  guide?: string;
}
export interface GraphLineStyle {
  width?: number;
  opacity?: number;
  activeWidth?: number;
  activeOpacity?: number;
  inactiveOpacity?: number;
}

export interface NetworkGraphProps extends HouseKeys {
  className?: string;
  data: GraphData;
  colors?: GraphColors;
  lineStyle?: GraphLineStyle;
  initialZoom?: number;
  selected?: string;
  handleSelect?: HandlerKey<GraphNode, "network-graph">;
  handleClick?: HandlerKey<GraphNode, "network-graph">;
}
