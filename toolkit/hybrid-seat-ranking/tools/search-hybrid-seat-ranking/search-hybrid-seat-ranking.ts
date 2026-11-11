import type { Tool as UsageTool, ToolReturn } from "../../../Tooling.types.ts";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { searchProject } from "../project-search.ts";

type SkillRecord = {
  type?: string;
  instructions?: string;
  outputs?: { body?: { source?: { id?: number; key?: string } } };
};
type World = { id: number; url?: string };

/** Presentation follows the returned record; ranking and original evidence remain intact. */
export const presentSearchResult = (
  result: ToolReturn,
  world: World,
): ToolReturn => {
  const top = result.response?.paths?.[0] as SkillRecord | undefined;
  if (result.status !== "complete" || top?.type !== "skill") return result;
  const source = top.outputs?.body?.source;
  let body = top.instructions;
  if (source) {
    if (source.id !== world.id || source.key !== "url" || !world.url)
      return {
        ...result,
        status: "error",
        error: "The skill's URL source does not resolve to this world's url.",
      };
    const url = new URL(world.url);
    if (!["http:", "https:"].includes(url.protocol))
      return {
        ...result,
        status: "error",
        error: "The world's url must use HTTP or HTTPS.",
      };
    body = world.url;
  }
  if (typeof body !== "string" || !body.trim())
    return {
      ...result,
      status: "error",
      error: "The returned skill has no display text.",
    };
  return {
    ...result,
    return_type: "skill",
    response: {
      ...result.response,
      type: "skill",
      response_type: "skill",
      evidence: result.response?.body,
      body: body.trim(),
    },
  };
};

export const executeTool: UsageTool = async (settings) => {
  const result = await searchProject(settings);
  const project =
    typeof settings.path === "string"
      ? settings.path
      : fileURLToPath(new URL("../../../../", import.meta.url));
  const world = JSON.parse(
    await readFile(resolve(project, "rab.world.json"), "utf8"),
  );
  return presentSearchResult(result, world);
};

export const run: UsageTool = async (settings) => {
  let result: ToolReturn;
  try {
    result = await executeTool(settings);
  } catch (error) {
    result = {
      return_type: "results",
      status: "error",
      settings,
      error: error instanceof Error ? error.message : String(error),
    };
  }
  try {
    const { finishToolUsage } =
      await import("../../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1793154927345, settings, result);
  } catch (error) {
    return {
      ...result,
      error: [
        result.error,
        `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`,
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }
};
