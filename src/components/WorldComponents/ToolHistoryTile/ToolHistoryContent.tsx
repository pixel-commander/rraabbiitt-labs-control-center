import { RunnerContent } from "./RunnerContent/RunnerContent";
import { LlmContent } from "./LlmContent/LlmContent";
import { ToolContent } from "./ToolContent/ToolContent";
import { ScaffoldContent } from "./ScaffoldContent/ScaffoldContent";
import type { ToolHistoryTileProps } from "./ToolHistoryTile.types";
import type { ComponentType } from "react";
import type { ToolContentProps } from "./ToolContent/ToolContent.types";

const TILE_TYPES: Partial<Record<string, ComponentType<ToolContentProps>>> = {
  runner: RunnerContent,
  tool: ToolContent,
  llm: LlmContent,
  component: ScaffoldContent,
};

export const ToolHistoryContent = ({ run }: Pick<ToolHistoryTileProps, "run">) => {
  const response = run.response && typeof run.response === "object" ? run.response as Record<string, unknown> : undefined;
  const type = typeof response?.type === "string" ? response.type : run.type;
  const RenderTile = TILE_TYPES[type || ""] || null;
  return RenderTile ? <RenderTile run={run} response={run.response} settings={run.settings} status={run.status} return_type={run.return_type} /> : null;
};


