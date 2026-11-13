import type { HouseKeys } from "../../../HouseKeys.types";
export interface GraphLegendItem extends HouseKeys {
  name: string;
  shape?: "circle" | "square";
}
export interface GraphLegendProps extends HouseKeys {
  className?: string;
  data: GraphLegendItem[];
}
