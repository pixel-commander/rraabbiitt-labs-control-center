import type { ComponentType } from "react";
import type { HouseKeys } from "./HouseKeys.types";

export interface VIEWProps extends HouseKeys {
  id: number;
  name: string;
  title: string;
  path: string;
  file?: string;
  View: ComponentType;
  props?: { path: string };
  Icon?: ComponentType;
}
