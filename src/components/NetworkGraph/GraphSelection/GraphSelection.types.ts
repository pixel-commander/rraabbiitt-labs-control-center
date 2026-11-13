import type { HouseKeys, HandlerKey } from "../../../HouseKeys.types";
import type { GraphData, GraphNode } from "../NetworkGraph.types";

export interface GraphSelectionProps extends HouseKeys {
  className?: string;
  data: GraphData;
  selected?: string;
  handleSelect?: HandlerKey<GraphNode, "network-graph">;
}
