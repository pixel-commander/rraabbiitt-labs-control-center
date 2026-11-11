import type { ReactNode } from "react";
import type {
  HouseKeys,
  HouseIdProps,
  HandlerKey,
} from "../../HouseKeys.types";
export interface SiteNavItem extends HouseKeys {
  id: HouseIdProps;
  label: ReactNode;
  path: string;
  handleClick?: HandlerKey<SiteNavItem, "site-nav", void, SiteNavProps>;
}
export interface SiteNavProps extends Omit<HouseKeys, "name"> {
  Logo?: ReactNode;
  name: ReactNode;
  Left?: ReactNode;
  nav_items?: SiteNavItem[];
  Right?: ReactNode;
  handleClick: HandlerKey<SiteNavItem, "site-nav", void, SiteNavProps>;
  selected?: string;
  render?: (item: SiteNavItem, type: "nav-item") => ReactNode;
  className?: string;
}
