import { generate } from "../generate-factory-composition/generate-factory-composition.ts";
import { api, find } from "../find-factory-composition/find-factory-composition.ts";
import type { SaveFactoryCompositionSettings, FactoryCompositionResponse } from "../../../Factory.types.ts";
export async function save(settings: SaveFactoryCompositionSettings): Promise<FactoryCompositionResponse> {
  const { type: _type, warnings: _warnings, ...composition } = await generate({ composition: settings.composition });
  let previous: Record<string, unknown> = {};
  if (settings.id !== undefined) previous = { ...await find({ id: settings.id }) };
  const record: Record<string, unknown> = { ...previous, composition };
  for (const key of ["name", "title", "description", "type", "tags", "file", "path", "paths"] as const) {
    if (settings[key] !== undefined) record[key] = settings[key];
  }
  record.name ??= composition.name ?? composition.root?.name;
  const { result, origin } = await api(settings.id === undefined ? "" : `/${settings.id}`, settings.id === undefined ? "POST" : "PUT", record);
  return { ...result, url: `${origin}/factory#${result.id}` };
}

import type { ToolsProps, ToolReturn } from "../../../../../../toolkit/Tooling.types.ts";

/** @param {ToolsProps} props @returns {Promise<ToolReturn>} */
export const run = async (props: ToolsProps): Promise<ToolReturn> => {
  const settings = props;
  /** @type {ToolReturn} */
  let result: ToolReturn;
  try {
    result = { return_type: "results", status: "complete", settings, response: await save(props as SaveFactoryCompositionSettings) };
  } catch (error) {
    result = { return_type: "results", status: "error", settings,
      error: error instanceof Error ? error.message : String(error) };
  }
  // Usage fires once, after the work and before return. No console output.
  try {
    const { finishToolUsage } = await import("../../../../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1794610757634, settings, result);
  } catch (error) {
    return { ...result, error: [result.error,
      `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`]
      .filter(Boolean).join("\n") };
  }
};
