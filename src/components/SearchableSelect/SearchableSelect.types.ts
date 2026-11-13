import type { ReactNode } from "react";
import type { HouseKeys, PathsProps, HandlerKey } from "../../HouseKeys.types";

export interface SearchableSelectProps extends HouseKeys {
  children?: ReactNode;
  className?: string;
  container_class?: string;
  data?: (HouseKeys & PathsProps)[];
  selected?: HouseKeys & PathsProps;
  placeholder?: string;
  label?: string;
  name?: string;
  disabled?: boolean;
  appearance?: "default" | "text";
  searchable?: boolean;
  status?: { pending: boolean; error?: string };
  handleClick?: HandlerKey<HouseKeys & PathsProps, "searchable-select", void>;
  handleChange?: HandlerKey<
    { query: string },
    "searchable-select",
    void | Promise<void>
  >;
}
