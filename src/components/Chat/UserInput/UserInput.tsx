import type { UserInputProps } from "./UserInput.types";
import "./css/user-input.css";

export const UserInput = ({
  handleSubmit,
  handleChange,
  placeholder = "Message",
  disabled = false,
  className = "",
}: UserInputProps) => {
  return (
    <div className={["user-input", className].filter(Boolean).join(" ")}>
      <form
        data-grid="side-right"
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault();
          const message = String(
            new FormData(event.currentTarget).get("message") ?? "",
          );
          handleSubmit?.({ message }, "user-input");
        }}
      >
        <input
          data-area="main"
          name="message"
          type="text"
          autoComplete="off"
          aria-label="Message"
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) =>
            handleChange?.({ message: event.currentTarget.value }, "user-input")
          }
        />
        <button data-area="side" type="submit" disabled={disabled}>
          Send
        </button>
      </form>
    </div>
  );
};
