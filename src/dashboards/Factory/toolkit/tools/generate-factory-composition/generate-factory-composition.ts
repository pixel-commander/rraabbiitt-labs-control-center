import { createServer } from "vite";
// @ts-expect-error Existing JavaScript runtime has no declarations.
import { projectRoot } from "../../../../../../scripts/world.mjs";
// @ts-expect-error Existing JavaScript importer has no declarations.
import { generateCompositionFromMarkup } from "../../../components/ComponentFactory/js/generateCompositionFromMarkup/generateCompositionFromMarkup.mjs";
import type { FactoryDocument } from "../../../components/ComponentFactory/ComponentFactory.types";
import type { GenerateFactoryCompositionSettings, FactoryCompositionResponse } from "../../../Factory.types.ts";
let parser: Promise<(input: unknown) => FactoryDocument> | undefined;
const read = () => parser ??= (async () => {
  const server = await createServer({ root: projectRoot, configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true }, appType: "custom" });
  try { return (await server.ssrLoadModule("/src/dashboards/Factory/components/ComponentFactory/js/compositionTree.ts")).readComposition; }
  finally { await server.close(); }
})();

export async function generate(settings: GenerateFactoryCompositionSettings): Promise<FactoryCompositionResponse> {
  if ((settings.composition === undefined) === (settings.content === undefined)) throw Error("Supply exactly one of composition or content (static markup).");
  let input: unknown = settings.composition;
  let warnings: string[] = [];
  if (settings.content !== undefined) {
    const imported = generateCompositionFromMarkup(settings.content, { name: settings.name });
    if (imported.status === "error") throw Error(imported.error);
    input = imported.response;
    warnings = imported.response.warnings;
    // Presentation fields are not part of the persisted document envelope.
    const { type: _type, warnings: _warnings, ...document } = input as FactoryCompositionResponse;
    input = document;
  }
  const document = (await read())(input);
  if (settings.name !== undefined) document.name = settings.name;
  if (settings.title !== undefined) document.title = settings.title;
  if (settings.description !== undefined) document.description = settings.description;
  return { ...document, type: "composition", warnings };
}


import type { ToolsProps, ToolReturn } from "../../../../../../toolkit/Tooling.types.ts";

/** @param {ToolsProps} props @returns {Promise<ToolReturn>} */
export const run = async (props: ToolsProps): Promise<ToolReturn> => {
  const settings = props;
  /** @type {ToolReturn} */
  let result: ToolReturn;
  try {
    result = { return_type: "results", status: "complete", settings, response: await generate(props as GenerateFactoryCompositionSettings) };
  } catch (error) {
    result = { return_type: "results", status: "error", settings,
      error: error instanceof Error ? error.message : String(error) };
  }
  // Usage fires once, after the work and before return. No console output.
  try {
    const { finishToolUsage } = await import("../../../../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1794610753145, settings, result);
  } catch (error) {
    return { ...result, error: [result.error,
      `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`]
      .filter(Boolean).join("\n") };
  }
};
