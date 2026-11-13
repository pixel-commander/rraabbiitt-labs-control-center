import type { HandlerKey, HouseKeys } from "../../HouseKeys.types";
import type { TabNavItem } from "../TabNav/TabNav.types";

export type ToggleGroupItem = TabNavItem;

export interface ToggleGroupProps extends HouseKeys {
  items?: ToggleGroupItem[];
  selected?: string;
  handleClick?: HandlerKey<ToggleGroupItem, "toggle-group", void, ToggleGroupProps>;
  className?: string;
}
