import type { HouseKeys } from "../../../HouseKeys.types.ts";
export interface NewReactDashboardProps extends HouseKeys {
  name: string;
  path: string;
  layout?: "header-main";
  title?: string;
  description?: string;
  content?: string;
  tags?: string[];
}
export interface NewReactDashboardRecord extends HouseKeys {
  id: number;
  name: string;
  title: string;
  description: string;
  type: "dashboard";
  tags: string[];
  settings: unknown[];
}
