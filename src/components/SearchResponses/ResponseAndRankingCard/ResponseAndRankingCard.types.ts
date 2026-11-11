import type { ReactNode } from "react";
import type { HouseKeys, HandlerKey } from "../../../HouseKeys.types";
import type { VoteType } from "../SearchResponses.types";

export type ResponseAndRankingAction = VoteType | "rephrase";
export interface ResponseAndRankingCardProps extends Omit<HouseKeys, "title"> {
  title?: ReactNode;
  rank?: number;
  score?: number;
  action_class?: string;
  data?: unknown;
  disabled?: boolean;
  vote?: VoteType;
  handleClick?: HandlerKey<
    unknown,
    ResponseAndRankingAction,
    void,
    ResponseAndRankingCardProps
  >;
  className?: string;
}
