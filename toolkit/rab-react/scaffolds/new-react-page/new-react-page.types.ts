import type { HouseKeys } from "../../../HouseKeys.types.ts";
export interface NewReactPageProps extends HouseKeys {
  name: string;
  path: string;
  title?: string;
  description?: string;
  content?: string;
  save_as_text?: boolean;
  tags?: string[];
}
export interface NewReactPageRecord extends HouseKeys {
  id: number;
  name: string;
  title: string;
  description: string;
  type: "page";
  tags: string[];
  settings: unknown[];
}
