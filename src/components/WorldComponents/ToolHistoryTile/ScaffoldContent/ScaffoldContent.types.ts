import type { ToolHistoryTileProps } from "../ToolHistoryTile.types";

export interface ScaffoldContentProps {
  run?: ToolHistoryTileProps["run"];
  response?: unknown;
  settings?: Record<string, unknown>;
  status?: string;
  className?: string;
}

