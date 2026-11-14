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
  /** Stable identity keeps elastic simulation state attached to its wire. */
  id?:string|number;
  source: string;
  target: string;
  color?: string;
  /** Omitted keeps the original NetworkGraph cubic connector. */
  route?: "elastic" | "curve" | "straight" | "ortho" | "bolt";
  fx?: "none" | "pulse" | "flow" | "crackle";
  fxOn?: "all" | "active";
  routeSettings?: Record<string, number | undefined>;
  effectSettings?: Record<string, number | undefined>;
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
  /** Show the reusable SmartTooltip for hovered nodes. Default true. */
  tooltips?: boolean;
  data: GraphData;
  colors?: GraphColors;
  lineStyle?: GraphLineStyle;
  initialZoom?: number;
  selected?: string;
  /** Traveling effect on edges touching the pinned selection. Default crackle; none disables it. */
  selectedEffect?: "none" | "pulse" | "flow" | "crackle";
  handleSelect?: HandlerKey<GraphNode, "network-graph">;
  handleClick?: HandlerKey<GraphNode, "network-graph">;
}
