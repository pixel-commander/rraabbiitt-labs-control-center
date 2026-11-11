import type { Tool as UsageTool, ToolReturn as UsageToolReturn } from "../../../Tooling.types.ts";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Tool, ToolReturn } from "../../../Tooling.types.ts";
// Dedicated process: tuning must not block the warm search worker or status polling.
export const executeTool: Tool = (settings) =>
  new Promise<ToolReturn>((resolve) => {
    const bundled = fileURLToPath(
      new URL(
        "../../../../models/hybrid-seat-ranking/.venv/Scripts/python.exe",
        import.meta.url,
      ),
    );
    const python =
      process.env.TOOL_LEARNER_PYTHON ??
      (existsSync(bundled) ? bundled : "python");
    const child = spawn(
      python,
      [fileURLToPath(new URL("./tune_ranking_model.py", import.meta.url))],
      { windowsHide: true },
    );
    let output = "";
    let errors = "";
    let settled = false;
    const finish = (result: ToolReturn) => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };
    child.stdout.on("data", (chunk) => {
      output += chunk;
      if (output.length > 20_000_000) {
        child.kill();
        finish({ return_type: "summary",
          status: "error",
          settings,
          error: "Training response exceeded 20 MB",
        });
      }
    });
    child.stderr.on("data", (chunk) => {
      errors = (errors + chunk).slice(-4000);
    });
    child.on("error", (error) =>
      finish({ return_type: "summary", status: "error", settings, error: error.message }),
    );
    child.on("close", () => {
      try {
        const result = JSON.parse(output);
        if (!["complete", "error"].includes(result.status))
          throw new Error("Invalid training response");
        finish(result);
      } catch {
        finish({ return_type: "summary",
          status: "error",
          settings,
          error: errors || "Training process ended without a valid response",
        });
      }
    });
    child.stdin.on("error", (error) =>
      finish({ return_type: "summary", status: "error", settings, error: error.message }),
    );
    child.stdin.end(JSON.stringify(settings));
  });

export const run: UsageTool = async (settings) => {
  let result: UsageToolReturn;
  try {
    result = { ...await executeTool(settings), return_type: "summary" as const };
  } catch (error) {
    result = { return_type: "summary", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
  try {
    const { finishToolUsage } = await import("../../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1793221495963, settings, result);
  } catch (error) {
    return { ...result, error: [result.error, `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`].filter(Boolean).join("\n") };
  }
};
