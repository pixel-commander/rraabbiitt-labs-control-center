import type { ToolHistoryTileProps } from "../ToolHistoryTile.types";

export interface ToolContentProps {
  run?: ToolHistoryTileProps["run"];
  response?: unknown;
  settings?: Record<string, unknown>;
  status?: string;
  return_type?: string;
  className?: string;
}

