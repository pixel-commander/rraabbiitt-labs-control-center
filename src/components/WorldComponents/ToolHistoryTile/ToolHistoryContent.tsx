import { RunnerContent } from "./RunnerContent/RunnerContent";
import { LlmContent } from "./LlmContent/LlmContent";
import { ToolContent } from "./ToolContent/ToolContent";
import type { ToolHistoryTileProps } from "./ToolHistoryTile.types";
import type { ComponentType } from "react";
import type { ToolContentProps } from "./ToolContent/ToolContent.types";

const TILE_TYPES: Partial<Record<string, ComponentType<ToolContentProps>>> = {
  runner: RunnerContent,
  tool: ToolContent,
  llm: LlmContent,
};

export const ToolHistoryContent = ({ run }: Pick<ToolHistoryTileProps, "run">) => {
  const RenderTile = TILE_TYPES[run.type || ""] || null;
  return RenderTile ? <RenderTile response={run.response} settings={run.settings} status={run.status} return_type={run.return_type} /> : null;
};


