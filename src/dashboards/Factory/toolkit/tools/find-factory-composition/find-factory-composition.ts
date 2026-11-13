// @ts-expect-error Existing JavaScript runtime has no declarations.
import { loadWorld } from "../../../../../../scripts/world.mjs";
import type { FindFactoryCompositionSettings, FactoryCompositionResponse } from "../../../Factory.types.ts";
export async function api(path: string, method = "GET", body?: unknown) {
  const world = await loadWorld();
  const origin = new URL(world.url).origin;
  const response = await fetch(`${origin}/api/factory/compositions${path}`, {
    method, headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok) throw Error(result.error ?? `Factory API returned ${response.status}.`);
  return { result, origin };
}

export async function find(settings: FindFactoryCompositionSettings): Promise<FactoryCompositionResponse> {
  if (settings.id !== undefined) {
    if (!Number.isSafeInteger(settings.id) || settings.id < 1) throw Error("id must be a positive integer.");
    const { result, origin } = await api(`/${settings.id}`);
    return { ...result, url: `${origin}/factory#${result.id}` };
  }
  const limit = settings.limit ?? 50, offset = settings.offset ?? 0;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset) || offset < 0) throw Error("Use limit 1–100 and a nonnegative offset.");
  if (settings.query !== undefined && typeof settings.query !== "string") throw Error("query must be a string.");
  const terms = settings.query?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];
  let matches: any[] = [], total = 0, page = 0;
  do {
    const { result, origin } = await api(`?limit=100&offset=${page}`);
    total = result.total;
    matches.push(...result.items.filter((item: any) => terms.every(term =>
      [item.name, item.title, item.description, ...(item.tags ?? [])].join(" ").toLowerCase().includes(term)))
      .map((item: any) => ({ ...item, url: `${origin}/factory#${item.id}` })));
    page += 100;
  } while (page < total);
  const paths = matches.slice(offset, offset + limit);
  return { response_type: "list", type: "composition", paths, summary: { count: paths.length, total: matches.length } };
}


import type { ToolsProps, ToolReturn } from "../../../../../../toolkit/Tooling.types.ts";

/** @param {ToolsProps} props @returns {Promise<ToolReturn>} */
export const run = async (props: ToolsProps): Promise<ToolReturn> => {
  const settings = props;
  /** @type {ToolReturn} */
  let result: ToolReturn;
  try {
    result = { return_type: "results", status: "complete", settings, response: await find(props as FindFactoryCompositionSettings) };
  } catch (error) {
    result = { return_type: "results", status: "error", settings,
      error: error instanceof Error ? error.message : String(error) };
  }
  // Usage fires once, after the work and before return. No console output.
  try {
    const { finishToolUsage } = await import("../../../../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1794610755409, settings, result);
  } catch (error) {
    return { ...result, error: [result.error,
      `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`]
      .filter(Boolean).join("\n") };
  }
};
