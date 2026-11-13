import type { HouseKeys } from "../../../HouseKeys.types";

export interface GraphMetric extends HouseKeys {
  name: string;
  value: number;
}

export interface GraphFootprintProps extends HouseKeys {
  className?: string;
  data: GraphMetric[];
}
