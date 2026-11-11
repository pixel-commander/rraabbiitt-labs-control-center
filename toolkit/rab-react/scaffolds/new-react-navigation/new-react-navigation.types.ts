import type { HouseKeys } from "../../../HouseKeys.types.ts";
export interface NavRow {
  id: string | number;
  name: string;
  path: string;
}
export interface NewReactNavigationProps extends HouseKeys {
  name: string;
  path: string;
  title?: string;
  description?: string;
  rows: NavRow[];
  label?: string;
  grid?: string;
  class_name?: string;
  save_as_text?: boolean;
  tags?: string[];
}
export interface NewReactNavigationRecord extends HouseKeys {
  id: number;
  name: string;
  title: string;
  description: string;
  type: "navigation";
  tags: string[];
  settings: unknown[];
}
