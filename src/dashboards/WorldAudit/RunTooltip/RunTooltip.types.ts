import type { ReactNode, RefObject } from "react";
import type { AuditData } from "../hooks/useWorldAudit";

export interface RunTooltipProps<T extends Element> {
  run?: AuditData["runs"][number];
  title?: string;
  details?: { label: string; value: ReactNode }[];
  children: (targetRef: RefObject<T | null>) => ReactNode;
}
