import type { HouseKeys } from "../../../HouseKeys.types.ts";
export type GridTemplate =
  | "grid-dashboard"
  | "grid-dashboard-alt"
  | "grid-test"
  | "grid-test-1";
export interface NewGridAtomProps extends HouseKeys {
  name: string;
  path: string;
  title?: string;
  description?: string;
  grid?: GridTemplate;
  tags?: string[];
}
export interface NewGridAtomRecord extends HouseKeys {
  id: number;
  name: string;
  title: string;
  description: string;
  type: "grids";
  tags: string[];
  settings: unknown[];
}
