import type { ReactNode } from "react";
import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";
export interface StarRankingCriterion extends HouseKeys {
  name: string;
}
export interface StarRankingChange {
  criterion: StarRankingCriterion;
  value: number;
  total: number;
}
export interface StarRankingProps extends HouseKeys {
  children?: ReactNode;
  className?: string;
  criteria?: StarRankingCriterion[];
  scores?: Record<string, number>;
  max?: number;
  disabled?: boolean;
  readOnly?: boolean;
  showTotal?: boolean;
  handleChange?: HandlerKey<StarRankingChange, "star-ranking", void>;
}
