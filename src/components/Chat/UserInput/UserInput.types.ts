import type { HouseKeys } from "../../../HouseKeys.types";
import type { ChatInputHandler } from "../Chat.types";
export interface UserInputProps extends HouseKeys {
  handleSubmit?: ChatInputHandler;
  handleChange?: ChatInputHandler;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}
