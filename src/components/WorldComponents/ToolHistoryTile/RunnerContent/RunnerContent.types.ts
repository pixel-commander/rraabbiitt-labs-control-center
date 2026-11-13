import type { ToolHistoryTileProps } from "../ToolHistoryTile.types";

export interface RunnerContentProps {
  run?: ToolHistoryTileProps["run"];
  label?: string;
  response?: unknown;
  return_type?: string;
  settings?: Record<string, unknown>;
  status?: string;
  className?: string;
}


