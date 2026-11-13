import type { HouseKeys } from "../../../HouseKeys.types";
import type { ChatMessage, ChatMessageHandler } from "../Chat.types";
export interface MessagesProps extends HouseKeys {
  messages: ChatMessage[];
  handleClick?: ChatMessageHandler;
  className?: string;
}
