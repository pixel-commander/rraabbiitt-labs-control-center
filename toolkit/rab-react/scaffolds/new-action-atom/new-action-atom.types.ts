import type { HouseKeys } from "../../../HouseKeys.types.ts";
export interface NewActionAtomProps extends HouseKeys {
  name: string;
  path: string;
  title?: string;
  description?: string;
  styles?: string;
  name_prefix?: string;
  tags?: string[];
}
export interface NewActionAtomRecord extends HouseKeys {
  id: number;
  name: string;
  title: string;
  description: string;
  type: "actions";
  tags: string[];
  settings: unknown[];
}
