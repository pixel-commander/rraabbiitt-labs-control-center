import { useId } from "react";
import type { FormEvent, ChangeEvent, KeyboardEvent } from "react";
import type { MessageBoxProps } from "../../MessageBox.types";
import { useMessageProvider } from "../useMessageProvider/useMessageProvider";
export const useMessageBox = (props: MessageBoxProps) => {
  const inputId = useId();
  const provider = useMessageProvider(props);
  const value = provider.message;
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    provider.handleChange(event.currentTarget.value, "message-box", props);
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    provider.handleSubmit(value, "message-box", props);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing ||
      event.nativeEvent.keyCode === 229
    ) {
      return;
    }
    event.preventDefault();
    if (!event.repeat) event.currentTarget.form?.requestSubmit();
  };
  return { inputId, value, handleChange, handleSubmit, handleKeyDown };
};
