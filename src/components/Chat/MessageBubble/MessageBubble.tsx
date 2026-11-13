import type { MessageBubbleProps } from "./MessageBubble.types";
import "./css/message-bubble.css";

export const MessageBubble = ({
  side = "left",
  name,
  message,
  status,
  date,
  handleClick,
  className = "",
  container_class = "",
}: MessageBubbleProps) => {
  return (
    <div
      className={[
        "message-bubble grid auto auto",
        side === "right" ? "message-bubble--user" : "message-bubble--response",
        container_class,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-grid="auto-auto"
      data-side={side}
    >
      <article
        className={`message-bubble__content container-cell${side === "left" ? " container-cell--float" : ""}`}
      >
        <header className="message-bubble__name">
          {handleClick ? (
            <button
              className="message-bubble__name-action"
              type="button"
              onClick={() =>
                handleClick({ name, message, side }, "message-click")
              }
            >
              {name}
            </button>
          ) : (
            name
          )}
        </header>
        <div className="message-bubble__message">{message}</div>
        {(date !== undefined || status !== undefined) && (
          <footer className="message-bubble__meta">
            {date !== undefined && (
              <time dateTime={new Date(date).toISOString()}>
                {new Date(date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            )}
            {date !== undefined && status !== undefined && " | "}
            {status !== undefined && <span>{status}</span>}
          </footer>
        )}
      </article>
    </div>
  );
};
