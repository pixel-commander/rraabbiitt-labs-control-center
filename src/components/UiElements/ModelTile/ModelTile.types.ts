import type { ReactNode } from "react";
import type { StatusLabelProps } from "../StatusLabel/StatusLabel.types";
export interface ModelTileProps extends Omit<StatusLabelProps, "title"> {
  title?: ReactNode;
}
