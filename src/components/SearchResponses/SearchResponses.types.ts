import type { ChatBubbleProps } from "./ChatBubble/ChatBubble.types";
import type { ReactNode } from "react";
import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";
export type VoteType = "good-vote" | "bad-vote" | "ok-vote";
export type SearchResponseAction = VoteType | "rephrase" | "favorite";
export interface SearchResponseContentProps extends Omit<HouseKeys, "title"> {
  container_aton?: string;
  container_class?: string;
  action_class?: string;
  title?: ReactNode;
  score?: number;
  color?: string;
  children?: ReactNode;
  data?: unknown;
  disabled?: boolean;
  /** Hide feedback actions for display-only ranked results. */
  show_actions?: boolean;
  vote?: VoteType;
  favorite?: boolean;
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
