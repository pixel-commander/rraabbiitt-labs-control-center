import { ChatBubble } from "./ChatBubble/ChatBubble";
import type { SearchResponsesProps } from "./SearchResponses.types";
import { TopResult } from "./TopResult/TopResult";

export const SearchResponses = (props: SearchResponsesProps) => {
  const { result_type } = props;
  if (result_type === "top-result") return <TopResult {...props} />;

  if (result_type === "search-response") return <ChatBubble {...props} />;

  console.warn("invalid result type in SearchResponses", result_type);
  return <>invalid component type {result_type}</>;
};
