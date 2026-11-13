import type { ChatProps } from "./Chat.types";
import { Messages } from "./Messages/Messages";
import { UserInput } from "./UserInput/UserInput";
import { useChat } from "./hooks/useChat/useChat";
import "./css/chat.css";

export const Chat = ({
  messages = [],
  handleSubmit,
  handleChange,
  handleClick,
  placeholder,
  disabled,
  children,
  className = "",
}: ChatProps) => {
  const { scrollRef, onScroll } = useChat(messages);
  return (
    <div
      className={["chat", className].filter(Boolean).join(" ")}
      data-grid="main-footer"
    >
      <div data-area="main" data-rows="1" className="chat__main">
        <div
          className="chat__scroll scroll-y"
          ref={scrollRef}
          onScroll={onScroll}
        >
          <div className="chat__bottom">
            <Messages messages={messages} handleClick={handleClick} />
          </div>
        </div>
      </div>
      <footer data-area="footer" className="chat__footer">
        <UserInput
          handleSubmit={handleSubmit}
          handleChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
        />
        {children}
      </footer>
    </div>
  );
};
