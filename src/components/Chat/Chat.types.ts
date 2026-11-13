import type { ReactNode } from "react";
import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";

export interface ChatMessage extends HouseKeys {
  id: number;
  user: string;
  name?: string;
  message: ReactNode;
  status: "sent" | "read";
  date: number;
}
export type ChatInputHandler = HandlerKey<
  { message: string },
  "user-input",
  void
>;
export type ChatMessageHandler = HandlerKey<ChatMessage, "message-click", void>;
export interface ChatProps extends HouseKeys {
  messages?: ChatMessage[];
  handleSubmit?: ChatInputHandler;
  handleChange?: ChatInputHandler;
  handleClick?: ChatMessageHandler;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}
