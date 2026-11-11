import type { Tool as UsageTool, ToolReturn as UsageToolReturn } from "../../../Tooling.types.ts";
import type { Tool } from "../../../Tooling.types.ts";
import { run as execute } from "../tune-ranking-model/tune-ranking-model.ts";
export const executeTool: Tool = async (settings) => {
  const result = await execute({ ...settings, name: "compare" });
  return { ...result, settings };
};

export const run: UsageTool = async (settings) => {
  let result: UsageToolReturn;
  try {
    result = { ...await executeTool(settings), return_type: "results" as const };
  } catch (error) {
    result = { return_type: "results", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
  try {
    const { finishToolUsage } = await import("../../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1793225821352, settings, result);
  } catch (error) {
    return { ...result, error: [result.error, `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`].filter(Boolean).join("\n") };
  }
};
