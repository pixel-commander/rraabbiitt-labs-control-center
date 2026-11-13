import type { Tool as UsageTool, ToolReturn as UsageToolReturn } from "../../../Tooling.types.ts";
import type {
  GenerateWorldIdProps,
  GenerateWorldIdReturn,
} from "./generate-world-id.types.ts";
let previous = 0;
/** Timestamp identity; monotonic within this module instance, not across machines. */
export function generateWorldId(
  settings: GenerateWorldIdProps = {},
): GenerateWorldIdReturn {
  if (
    !settings ||
    typeof settings !== "object" ||
    Array.isArray(settings) ||
    Object.keys(settings).length
  )
    throw new TypeError("generate-world-id takes an empty settings object");
  previous = Math.max(Date.now(), previous + 1);
  return { id: previous };
}

const executeTool: UsageTool = async (settings) => ({ return_type: "settings", status: "complete", settings, response: generateWorldId(settings as GenerateWorldIdProps) });

export const run: UsageTool = async (settings) => {
  let result: UsageToolReturn;
  try {
    result = { ...await executeTool(settings), return_type: "settings" as const };
  } catch (error) {
    result = { return_type: "settings", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
  try {
    const { finishToolUsage } = await import("../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1790784702601, settings, result);
  } catch (error) {
    return { ...result, error: [result.error, `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`].filter(Boolean).join("\n") };
  }
};
