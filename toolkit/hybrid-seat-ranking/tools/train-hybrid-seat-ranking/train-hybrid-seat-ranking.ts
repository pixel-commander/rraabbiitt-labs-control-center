import type { Tool as UsageTool, ToolReturn as UsageToolReturn } from "../../../Tooling.types.ts";
import type { Tool } from "../../../Tooling.types.ts";
import { execute } from "../execute.ts";
export const executeTool: Tool = (settings) =>
  execute(settings, new URL("./train_hybrid_seat_ranking.py", import.meta.url));

export const run: UsageTool = async (settings) => {
  let result: UsageToolReturn;
  try {
    result = { ...await executeTool(settings), return_type: "summary" as const };
  } catch (error) {
    result = { return_type: "summary", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
  try {
    const { finishToolUsage } = await import("../../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1793154927347, settings, result);
  } catch (error) {
    return { ...result, error: [result.error, `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`].filter(Boolean).join("\n") };
  }
};
