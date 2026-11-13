import { ResultsContent } from "../ResultsContent/ResultsContent";
import { SummaryContent } from "../SummaryContent/SummaryContent";
import { SettingsContent } from "../SettingsContent/SettingsContent";
import { ApiCallContent } from "../ApiCallContent/ApiCallContent";
import { ScaffoldContent } from "../ScaffoldContent/ScaffoldContent";
import { SkillContent } from "../SkillContent/SkillContent";
import type { ToolContentProps } from "./ToolContent.types";
import "./css/tool-content.css";

const TILE_TYPES: Partial<Record<string, typeof ResultsContent>> = {
  results: ResultsContent,
  summary: SummaryContent,
  settings: SettingsContent,
  "api-call": ApiCallContent,
  scaffold: ScaffoldContent,
  skill: SkillContent,
};

export const ToolContent = ({ return_type, className = "", ...props }: ToolContentProps) => {
  const RenderTile = TILE_TYPES[return_type || ""] || null;
  return RenderTile ? <div className={["tool-content", className].filter(Boolean).join(" ")}><RenderTile {...props} /></div> : null;
};

