import { cp, mkdir, readFile, writeFile, realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { evaluationTestV1 } from "../../schema-versions.ts";
import type { NewReactTestSettings } from "../../schema-versions.types.ts";

export async function executeTool(settings: NewReactTestSettings): Promise<ToolReturn> {
  try {
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(settings.name)) throw Error("name must be lowercase hyphenated words.");
    if (typeof settings.save_path !== "string" || !settings.save_path.trim()) throw Error("save_path is required and must be an existing parent directory.");
    const test = evaluationTestV1.parse(settings.test);
    if (test.name !== settings.name) throw Error("Test name must match the destination folder name.");
    const parent = await realpath(settings.save_path);
    const target = resolve(parent, settings.name);
    const template = new URL("./template/", import.meta.url);
    // Read templates before reserving the destination. mkdir refuses any existing folder.
    const readme = await readFile(new URL("README.md", template), "utf8");
    const code = JSON.stringify(test, null, 2) + "\n";
    await mkdir(target);
    try {
      await mkdir(resolve(target, "runs"));
      await cp(new URL("runs/.gitkeep", template), resolve(target, "runs/.gitkeep"), { force: false, errorOnExist: true });
      await writeFile(resolve(target, "README.md"), readme, { flag: "wx" });
      await writeFile(resolve(target, "test.json"), code, { flag: "wx" });
    } catch (error) {
      throw Error(`Scaffolding failed; partial folder retained at ${target}: ${error instanceof Error ? error.message : String(error)}`);
    }
    return { return_type: "scaffold", status: "complete", settings,
      response: { id: test.id, name: test.name, type: test.type, path: target, file: "test.json", code,
        test_sha256: createHash("sha256").update(code).digest("hex"),
        paths: [{path:target,file:"test.json",type:"json"},{path:target,file:"README.md",type:"txt"},{path:resolve(target,"runs"),type:"path"}], summary: { count: 3 } } } as ToolReturn;
  } catch (error) {
    return { return_type: "scaffold", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
}
import type { ToolsProps, ToolReturn } from "../../../Tooling.types.ts";

/** @param {ToolsProps} props @returns {Promise<ToolReturn>} */
export const run = async (props: ToolsProps): Promise<ToolReturn> => {
  const settings = props;
  /** @type {ToolReturn} */
  let result: ToolReturn;
  try {
    result = await executeTool(props as NewReactTestSettings);
  } catch (error) {
    result = { return_type: "results", status: "error", settings,
      error: error instanceof Error ? error.message : String(error) };
  }
  // Usage fires once, after the work and before return. No console output.
  try {
    const { finishToolUsage } = await import("../../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1794613688090, settings, result);
  } catch (error) {
    return { ...result, error: [result.error,
      `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`]
      .filter(Boolean).join("\n") };
  }
};
