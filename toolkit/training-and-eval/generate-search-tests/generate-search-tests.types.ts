import type { ToolsProps } from "../../HouseKeys.types.ts";

export interface GenerateSearchTestsSettings extends ToolsProps {
  save_path: string;
  count?: number;
  seed?: number;
  /** Installed local model used only to shorten descriptions. */
  model?: string;
}
