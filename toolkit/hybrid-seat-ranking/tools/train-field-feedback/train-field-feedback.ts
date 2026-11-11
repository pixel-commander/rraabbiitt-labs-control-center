import type { Tool as UsageTool, ToolReturn as UsageToolReturn } from "../../../Tooling.types.ts";
import type { Tool } from "../../../Tooling.types.ts";
import { feedbackProject } from "../project-search.ts";
export const executeTool: Tool = (settings) => feedbackProject(settings);

export const run: UsageTool = async (settings) => {
  let result: UsageToolReturn;
  try {
    result = { ...await executeTool(settings), return_type: "settings" as const };
  } catch (error) {
    result = { return_type: "settings", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
  try {
    const { finishToolUsage } = await import("../../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1793154927349, settings, result);
  } catch (error) {
    return { ...result, error: [result.error, `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`].filter(Boolean).join("\n") };
  }
};
