import type { HouseKeys } from "../../../HouseKeys.types.ts";

export interface NewReactComponentProps extends HouseKeys {
  name: string;
  path: string;
  title?: string;
  description?: string;
  save_as_text?: boolean;
  grid?: string;
  class_name?: string;
  tags?: string[];
}

export interface NewReactComponentRecord extends HouseKeys {
  id: number;
  name: string;
  title: string;
  description: string;
  type: "component";
  tags: string[];
  settings: unknown[];
}
