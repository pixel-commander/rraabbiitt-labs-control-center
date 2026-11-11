import type { HouseKeys } from "../../../HouseKeys.types.ts";
export interface NewContainerAtomProps extends HouseKeys {
  name: string;
  path: string;
  title?: string;
  description?: string;
  styles?: string;
  name_prefix?: string;
  tags?: string[];
}
export interface NewContainerAtomRecord extends HouseKeys {
  id: number;
  name: string;
  title: string;
  description: string;
  type: "containers";
  tags: string[];
  settings: unknown[];
}
