import type { ReactNode, CSSProperties } from "react";
import type { HouseKeys } from "../../../HouseKeys.types";
export interface StatusLabelProps extends Omit<HouseKeys, "title"> {
  title?: ReactNode;
  status?: "success" | "warn" | "error" | "waiting";
  status_color?: CSSProperties["color"];
  label_color?: CSSProperties["color"];
  label?: ReactNode;
  className?: string;
}
