import type {
  HouseKeys,
  HouseHandlers,
  HandlerKey,
} from "../../HouseKeys.types";

export interface SearchBarProps
  extends HouseKeys, Omit<HouseHandlers, "handleSubmit" | "handleChange"> {
  handleSubmit?: HandlerKey<{ search: string }, "search-bar", unknown, SearchBarProps>;
  handleChange?: HandlerKey<{ search: string }, "search-bar", unknown, SearchBarProps>;
  className?: string;
  container_class?: string;
  input_class?: string;
  auto_complete?: boolean;
}
