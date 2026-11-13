import { readFile } from "node:fs/promises";
import { runTools } from "../../toolkit/runners/run-tools.ts";
import type { ToolsProps, ToolReturn } from "../../toolkit/Tooling.types.ts";

/** Called by each tool after its work. Usage failures never change its outcome. */
export async function finishToolUsage(
  id: number,
  settings: ToolsProps,
  result: ToolReturn,
): Promise<ToolReturn> {
  if (settings.catalog !== false && result.status === "complete" && (result.return_type === "scaffold" || (result.return_type === "settings" && typeof result.response?.id === "number" && typeof result.response?.path === "string"))) {
    const { executeTool } = await import("../../toolkit/tools/refresh-world-database/refresh-world-database.ts");
    const { projectRoot } = await import("../../scripts/world.mjs");
    const [refreshed] = await runTools(
      [{ id: 1793210509222, name: "refresh-world-database", type: "tool", settings: { path: projectRoot } }],
      step => executeTool(step.settings),
    );
    if (refreshed.status !== "complete") return {
      ...result, status: "error", error: `Files were created, but catalog registration failed: ${refreshed.error}`,
    };
  }
  try {
    const world = JSON.parse(
      await readFile(new URL("../../rab.world.json", import.meta.url), "utf8"),
    );
    const api = world.paths?.filter((entry: { name?: string }) => entry.name === "api");
    if (api?.length !== 1 || !api[0].path)
      throw new Error("API folder is not registered in rab.world.json.");
    if (!world.mcp?.host || !Number.isInteger(world.mcp.port))
      throw new Error("API host and port are missing from rab.world.json.");
    if (settings.message !== undefined && !Number.isSafeInteger(settings.message))
      throw new Error("Usage message must be a numeric database message ID.");
    const usage = {
      id,
      date: Date.now(),
      ...(settings.message !== undefined ? { message: settings.message } : {}),
    };
    const response = await fetch(
      new URL("/api/tool-usage", `http://${world.mcp.host}:${world.mcp.port}`),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.MCP_TOKEN ? { Authorization: `Bearer ${process.env.MCP_TOKEN}` } : {}),
        },
        body: JSON.stringify(usage),
        signal: AbortSignal.timeout(1500),
      },
    );
    const returned = await response.json();
    if (!response.ok || returned.status !== "complete")
      throw new Error(returned.error ?? `Usage API returned HTTP ${response.status}.`);
    return result;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      ...result,
      error: [result.error, `Usage reporting failed: ${detail}`].filter(Boolean).join("\n"),
    };
  }
}
