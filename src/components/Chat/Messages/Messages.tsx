import type { MessagesProps } from "./Messages.types";
import { MessageBubble } from "../MessageBubble/MessageBubble";
import "./css/messages.css";

export const Messages = ({
  messages,
  handleClick,
  className = "",
}: MessagesProps) => {
  return (
    <div
      className={["messages", className].filter(Boolean).join(" ")}
      role="log"
      aria-label="Messages"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          side={message.user === "user" ? "right" : "left"}
          name={message.name ?? message.user}
          message={message.message}
          date={message.date}
          status={message.status}
          handleClick={
            handleClick
              ? () => handleClick(message, "message-click")
              : undefined
          }
        />
      ))}
    </div>
  );
};
