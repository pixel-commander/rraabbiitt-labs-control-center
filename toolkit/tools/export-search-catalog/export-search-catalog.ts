import type { Tool as UsageTool, ToolReturn as UsageToolReturn } from "../../Tooling.types.ts";
import { DatabaseSync } from "node:sqlite";
import { writeFile } from "node:fs/promises";
import type { Tool } from "../../Tooling.types.ts";
export const executeTool: Tool = async (settings) => {
  try {
    if (
      typeof settings.path !== "string" ||
      typeof settings.save_path !== "string"
    )
      throw Error("Supply database path and output save_path.");
    const db = new DatabaseSync(settings.path, { readOnly: true });
    let rows;
    try {
      rows = db.prepare("SELECT data FROM records WHERE json_extract(data, '$.record_key') IS NOT NULL ORDER BY id")
        .all().map(row => JSON.parse(String(row.data)));
    } finally {
      db.close();
    }
    await writeFile(settings.save_path, JSON.stringify(rows, null, 2) + "\n");
    return { return_type: "results",
      status: "complete",
      settings,
      response: { path: settings.save_path, summary: { count: rows.length } },
    };
  } catch (error) {
    return { return_type: "results",
      status: "error",
      settings,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const run: UsageTool = async (settings) => {
  let result: UsageToolReturn;
  try {
    result = { ...await executeTool(settings), return_type: "results" as const };
  } catch (error) {
    result = { return_type: "results", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
  try {
    const { finishToolUsage } = await import("../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1793676793815, settings, result);
  } catch (error) {
    return { ...result, error: [result.error, `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`].filter(Boolean).join("\n") };
  }
};
