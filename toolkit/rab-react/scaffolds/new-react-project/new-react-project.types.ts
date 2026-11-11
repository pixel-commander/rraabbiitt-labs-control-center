import type { HouseKeys } from "../../../HouseKeys.types.ts";
export interface NewReactProjectProps extends HouseKeys {
  name: string;
  path: string;
  title?: string;
  description?: string;
  tags?: string[];
}
export interface NewReactProjectRecord extends HouseKeys {
  id: number;
  name: string;
  title: string;
  description: string;
  type: "project";
  tags: string[];
  settings: unknown[];
}
