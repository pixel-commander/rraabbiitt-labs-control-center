import type { ReactNode } from "react";
import type { HouseKeys, HandlerKey } from "../../../HouseKeys.types";
import type { VoteType } from "../SearchResponses.types";

export type ResponseAndRankingAction = VoteType | "rephrase" | "favorite";
export interface ResponseAndRankingCardProps extends Omit<HouseKeys, "title"> {
  title?: ReactNode;
  rank?: number;
  score?: number;
  action_class?: string;
  container_class?: string;
  children?: ReactNode;
  data?: unknown;
  disabled?: boolean;
  vote?: VoteType;
  favorite?: boolean;
  handleClick?: HandlerKey<
    unknown,
    ResponseAndRankingAction,
    void,
    ResponseAndRankingCardProps
  >;
  className?: string;
}
