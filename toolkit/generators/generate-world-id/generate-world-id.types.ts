import type { HouseKeys } from "../../../HouseKeys.types.ts";
export type GenerateWorldIdProps = Record<string, never>;
export interface GenerateWorldIdReturn extends Pick<HouseKeys, "id"> {
  id: number;
}

