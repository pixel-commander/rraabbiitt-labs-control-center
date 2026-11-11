import type { ChatBubbleProps } from "./ChatBubble/ChatBubble.types";
import type { ReactNode } from "react";
import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";
export type VoteType = "good-vote" | "bad-vote" | "ok-vote";
export type SearchResponseAction = VoteType | "rephrase";
export interface SearchResponseContentProps extends Omit<HouseKeys, "title"> {
  container_aton?: string;
  container_class?: string;
  title?: ReactNode;
  score?: number;
  color?: string;
  children?: ReactNode;
  data?: unknown;
  disabled?: boolean;
  vote?: VoteType;
  className?: string;
  handleClick?: HandlerKey<
    unknown,
    SearchResponseAction,
    void,
    SearchResponsesProps
  >;
}

export type SearchResponsesProps = SearchResponseContentProps &
  (
    | { result_type: "top-result"; side?: never }
    | ({ result_type: "search-response" } & ChatBubbleProps)
  );
