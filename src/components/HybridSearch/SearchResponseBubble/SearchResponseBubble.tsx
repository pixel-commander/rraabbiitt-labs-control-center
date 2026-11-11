import { ChatBubble } from "../../SearchResponses/ChatBubble/ChatBubble";
import type { SearchResponseBubbleProps } from "./SearchResponseBubble.types";

export const SearchResponseBubble = (props: SearchResponseBubbleProps) => {
  return (
    <ChatBubble
      {...props}
      className={["search-response-bubble", props.className]
        .filter(Boolean)
        .join(" ")}
    />
  );
};
