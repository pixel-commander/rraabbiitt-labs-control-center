import type { Tool as UsageTool, ToolReturn as UsageToolReturn } from "../../Tooling.types.ts";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { dirname, resolve as resolvePath } from "node:path";
import type { Tool, ToolReturn } from "../../Tooling.types.ts";

export const executeTool: Tool = async (settings) => {
  let python = process.env.TOOL_LEARNER_PYTHON;
  if (!python) {
    let folder = resolvePath(typeof settings.path === "string" ? settings.path : fileURLToPath(new URL("../../../", import.meta.url)));
    while (true) {
      try {
        const world = JSON.parse(await readFile(resolvePath(folder, "rab.world.json"), "utf8"));
        const entries = world.paths.filter((entry: { name: string }) => entry.name === "search-python");
        if (entries.length !== 1) throw new Error("Register exactly one search-python interpreter in rab.world.json.");
        python = resolvePath(folder, entries[0].path, entries[0].file);
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT" && (error as NodeJS.ErrnoException).code !== "ENOTDIR")
          return { return_type: "summary", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
      }
      const parent = dirname(folder);
      if (parent === folder) break;
      folder = parent;
    }
  }
  return new Promise<ToolReturn>((resolve) => {
    const child = spawn(
      python ?? "python",
      [fileURLToPath(new URL("./refresh_world_database.py", import.meta.url))],
      { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    const fail = (error: Error) =>
      resolve({ return_type: "summary", status: "error", settings, error: error.message });
    child.stdout.setEncoding("utf8").on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.setEncoding("utf8").on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", fail);
    child.stdin.on("error", fail);
    child.on("close", (code) => {
      try {
        const result: ToolReturn = JSON.parse(stdout);
        if (result.status !== "complete" && result.status !== "error")
          throw new Error("Invalid tool response.");
        if (code !== 0 && result.status !== "error")
          throw new Error(stderr || `Python exited ${code}.`);
        resolve({ ...result, return_type: "summary", settings });
      } catch (error) {
        fail(
          new Error(
            stderr || (error instanceof Error ? error.message : String(error)),
          ),
        );
      }
    });
    child.stdin.end(JSON.stringify(settings));
  });
};

export const run: UsageTool = async settings => {
  let result: UsageToolReturn;
  try { result = await executeTool(settings); }
  catch (error) { result = { return_type: "summary", status: "error", settings, error: error instanceof Error ? error.message : String(error) }; }
  try {
    const { finishToolUsage } = await import("../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1793210509222, settings, result);
  } catch (error) {
    return { ...result, error: [result.error, `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`].filter(Boolean).join("\n") };
  }
};

// Direct execution uses the same exported tool contract.
const { runToolCli } = await import("../../rab-world/runners/tool-cli.mjs");
await runToolCli(import.meta.url, run);
