import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { resolve, relative, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createSettings } from "../../rab-world/scaffolds/new-settings-json/new-settings-json.mjs";
import { runToolCli } from "../../rab-world/runners/tool-cli.mjs";

const importPath = (folder, file) => {
  const value = relative(folder, file).replaceAll("\\", "/");
  return JSON.stringify(value.startsWith(".") ? value : `./${value}`);
};

export async function executeTool(settings = {}) {
  let folder;
  let created = false;
  try {
    if (typeof settings.path !== "string" || !settings.path.trim()) throw Error("Supply the destination parent path.");
    if (typeof settings.name !== "string" || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(settings.name))
      throw Error("name must be a lowercase hyphenated tool name.");
    const file = settings.file ?? `${settings.name}.ts`;
    const ext = extname(file);
    if (![".ts", ".js", ".mjs"].includes(ext) || file !== settings.name + ext)
      throw Error("file must be the tool name followed by .ts, .js or .mjs.");
    const { loadWorld } = await import("../../../scripts/world.mjs");
    const world = await loadWorld();
    const api = world.paths.filter(entry => entry.name === "api");
    if (api.length !== 1 || !api[0].path) throw Error("Register the API folder in rab.world.json.");
    folder = resolve(settings.path, settings.name);
    const record = await createSettings({ ...settings, title: settings.title ?? settings.name,
      description: settings.description ?? "New world tool.", type: "tool" });
    const template = JSON.parse(await readFile(new URL("./template/rab.settings.json", import.meta.url), "utf8"));
    const metadata = { ...template, ...record, path: folder.replaceAll("\\", "/"), file,
      settings: settings.settings ?? template.settings,
      paths: [{ path: ".", file, type: ext.slice(1) }, { path: ".", file: "rab.settings.json", type: "json" }] };
    const tooling = importPath(folder, fileURLToPath(new URL("../../Tooling.types.ts", import.meta.url)));
    const usage = importPath(folder, resolve(world.path, api[0].path, "tool-usage/finish-tool-usage.ts"));
    let source = await readFile(new URL("./template/[toolName].[ext]", import.meta.url), "utf8");
    const replacements = {
      "[typeImport]": ext === ".ts" ? `import type { ToolsProps, ToolReturn } from ${tooling};`
        : `/** @typedef {import(${tooling}).ToolsProps} ToolsProps */\n/** @typedef {import(${tooling}).ToolReturn} ToolReturn */`,
      "[inputType]": ext === ".ts" ? ": ToolsProps" : "",
      "[returnType]": ext === ".ts" ? ": Promise<ToolReturn>" : "",
      "[resultType]": ext === ".ts" ? ": ToolReturn" : "",
      "[id]": String(record.id), "[usageImport]": usage,
    };
    for (const [key, value] of Object.entries(replacements)) source = source.replaceAll(key, value);
    await mkdir(folder); created = true;
    await writeFile(join(folder, file), source, { flag: "wx" });
    await writeFile(join(folder, "rab.settings.json"), JSON.stringify(metadata, null, 2) + "\n", { flag: "wx" });
    return { return_type: "scaffold", status: "complete", settings,
      response: { id: record.id, path: metadata.path, file,
        paths: metadata.paths, summary: { count: 2 } } };
  } catch (error) {
    if (created) await rm(folder, { recursive: true, force: true });
    return { return_type: "scaffold", status: "error", settings,
      error: error instanceof Error ? error.message : String(error) };
  }
}

// The registered run wrapper and its fixed numeric ID are stamped during setup.

export const run = async (settings = {}) => {
  let result;
  try {
    result = { ...await executeTool(settings), return_type: "scaffold" };
  } catch (error) {
    result = { return_type: "scaffold", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
  try {
    const { finishToolUsage } = await import("../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1794415784109, settings, result);
  } catch (error) {
    return { ...result, error: [result.error, `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`].filter(Boolean).join("\n") };
  }
};

await runToolCli(import.meta.url, run);
