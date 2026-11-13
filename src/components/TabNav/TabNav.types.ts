import type { ReactNode } from "react";

import type {
  HandlerKey,
  HouseKeys,
  HouseIdProps,
} from "../../HouseKeys.types";

export interface TabNavItem extends HouseKeys {
  id: HouseIdProps;
  path: string;
  label: ReactNode;
  Icon?: ReactNode;
}

export interface StylerProps {
  [key: string]: {
    container_class?: string;
    action_class?: string;
  }
}

type TabNavSpacing = "xs" | "sm" | "md" | "lg" | "xl";

export interface TabNavProps extends HouseKeys {
  pad?: TabNavSpacing;
  gap?: TabNavSpacing | 0;
  full?: boolean;
  items?: TabNavItem[];
  selected?: string;
  handleClick?: HandlerKey<TabNavItem, "tab-nav">
  container_class?: string;
  action_class?: string;
  styler?: keyof StylerProps;
  className?: string;
}
