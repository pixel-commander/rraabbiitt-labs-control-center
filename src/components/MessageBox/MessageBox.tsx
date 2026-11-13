import type { MessageBoxProps } from "./MessageBox.types";
import { useMessageBox } from "./hooks/useMessageBox/useMessageBox";
import "./css/message-box.css";
export const MessageBox = (props: MessageBoxProps) => {
  const {
    place_holder = "Search your world…",
    container_class = "container-outline",
    submit_class = "action-filled",
    children,
    className = "",
  } = props;
  const { inputId, value, handleChange, handleSubmit, handleKeyDown } =
    useMessageBox(props);
  return (
    <form
      className={["message-box", container_class, className]
        .filter(Boolean)
        .join(" ")}
      onSubmit={handleSubmit}
    >
      <textarea
        id={inputId}
        className="message-box-query"
        aria-label={props.title ?? "Message"}
        placeholder={place_holder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <div className="message-box-children">{children}</div>
      <div className="message-box-actions" data-cols={props.handleClick ? "2" : "1"} data-gap="control">
        {props.handleClick && <button type="button" className="action-outline" disabled={!value.trim()}
          onClick={() => props.handleClick?.(value.trim(), "rephrase", props)}>Rephrase</button>}
      <button
        className={["message-box-submit", submit_class]
          .filter(Boolean)
          .join(" ")}
        type="submit"
        disabled={!value.trim()}
      >
        Run ↑
      </button>
      </div>
    </form>
  );
};
