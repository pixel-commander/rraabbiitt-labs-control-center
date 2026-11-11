import type { HouseKeys } from "../../../HouseKeys.types.ts";

export interface NewWorldBeaconJsonProps extends HouseKeys {
  path: string;
  name: string;
  type?: string;
  tags?: string[];
}

export interface NewWorldBeaconJsonRecord extends NewWorldBeaconJsonProps {
  id: number;
}

