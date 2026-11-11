import type { HouseKeys } from "../../../HouseKeys.types.ts";
export interface NewEffectAtomProps extends HouseKeys {
  name: string;
  path: string;
  title?: string;
  description?: string;
  styles?: string;
  name_prefix?: string;
  tags?: string[];
}
export interface NewEffectAtomRecord extends HouseKeys {
  id: number;
  name: string;
  title: string;
  description: string;
  type: "effects";
  tags: string[];
  settings: unknown[];
}
