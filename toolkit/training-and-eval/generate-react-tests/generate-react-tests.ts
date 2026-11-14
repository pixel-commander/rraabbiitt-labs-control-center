import { readFile } from "node:fs/promises";
import { evaluationTestV1 } from "../schema-versions.ts";
import { executeTool as scaffold } from "../scaffolds/new-react-test/new-react-test.ts";
import type { GenerateReactTestsSettings } from "../schema-versions.types.ts";

export async function executeTool(settings: GenerateReactTestsSettings): Promise<ToolReturn> {
  try {
    if (typeof settings.save_path !== "string" || !settings.save_path.trim()) throw Error("save_path is required.");
    if (settings.schema_version !== undefined && settings.schema_version !== 1) throw Error("Only schema_version 1 is supported.");
    const template = JSON.parse(await readFile(new URL("../scaffolds/new-react-test/template/test.json", import.meta.url), "utf8"));
    const candidate = { ...template, id: settings.id ?? Date.now(), name: settings.name,
      title: settings.title ?? settings.name, description: settings.description ?? "React tool-use evaluation", tags: settings.tags ?? ["react", "tool-use"] };
    for (const key of ["version", "prompt", "setup", "limits", "checks"] as const) if (settings[key] !== undefined) candidate[key] = settings[key];
    const test = evaluationTestV1.parse(candidate);
    const generated = await scaffold({ name: settings.name, save_path: settings.save_path, test });
    return { ...generated, return_type: "results", settings };
  } catch (error) {
    return { return_type: "results", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
}
import type { ToolsProps, ToolReturn } from "../../Tooling.types.ts";

/** @param {ToolsProps} props @returns {Promise<ToolReturn>} */
export const run = async (props: ToolsProps): Promise<ToolReturn> => {
  const settings = props;
  /** @type {ToolReturn} */
  let result: ToolReturn;
  try {
    result = await executeTool(props as GenerateReactTestsSettings);
  } catch (error) {
    result = { return_type: "results", status: "error", settings,
      error: error instanceof Error ? error.message : String(error) };
  }
  // Usage fires once, after the work and before return. No console output.
  try {
    const { finishToolUsage } = await import("../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1794613648645, settings, result);
  } catch (error) {
    return { ...result, error: [result.error,
      `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`]
      .filter(Boolean).join("\n") };
  }
};
