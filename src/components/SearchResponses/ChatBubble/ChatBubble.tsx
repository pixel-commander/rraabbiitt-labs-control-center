import type { ChatBubbleProps } from "./ChatBubble.types";
import "./css/chat-bubble.css";
export const ChatBubble = (props: ChatBubbleProps) => {
  const {
    side = "left",
    title = "Model",
    children,
    Footer,
    status = "sent",
    user_class = "container-alt",
    model_class = "container-alt",
    className = "",
  } = props;
  const time = props.date !== undefined ? new Date(props.date) : undefined;
  return (
    <article
      className={["chat-bubble", side, className].filter(Boolean).join(" ")}
    >
      <div data-cols="1" className="chat-bubble-inner gap-xs">
        {(side === "right" || title !== undefined) && (
          <header className="chat-bubble-title">
            {side === "right" ? <span>User</span> : title}
            {time && (
              <time dateTime={time.toISOString()}>
                {time.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            )}
          </header>
        )}
        <div
          className={[
            "chat-bubble-content",
            "pad-lg",
            side === "right" ? user_class : model_class,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </div>
        {(side === "left" || Footer !== undefined) && (
          <footer className="chat-bubble-footer">
            {Footer}
            {Footer !== undefined && side === "left" && " "}
            {side === "left" && (
              <span className="chat-bubble-status">
                {status === "read" ? "Read" : "Sent"}
              </span>
            )}
          </footer>
        )}
      </div>
    </article>
  );
};
