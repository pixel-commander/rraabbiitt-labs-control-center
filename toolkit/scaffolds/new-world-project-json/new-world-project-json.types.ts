import type { HouseKeys } from "../../../HouseKeys.types.ts";

export interface NewWorldProjectJsonProps extends HouseKeys {
  path: string;
  name: string;
  type?: string;
  tags?: string[];
}

export interface NewWorldProjectJsonRecord extends NewWorldProjectJsonProps {
  id: number;
}

