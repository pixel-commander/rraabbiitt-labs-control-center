import { runToolCli } from "../../runners/tool-cli.mjs";
import { generateWorldId } from "../../generators/generate-world-id/generate-world-id.ts";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const text = (value, label) => {
  if (typeof value !== "string" || !value.trim())
    throw new TypeError(`${label} must be nonempty text`);
  return value.trim();
};
export async function createSettings(input = {}) {
  const template = JSON.parse(
    await readFile(
      new URL("./template/rab.settings.json", import.meta.url),
      "utf8",
    ),
  );
  const { tags = template.tags, paths = template.paths } = input;
  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string"))
    throw new TypeError("tags must be a string array");
  if (!Array.isArray(paths)) throw new TypeError("paths must be an array");
  return {
    ...template,
    id: generateWorldId().id,
    name: text(input.name, "name"),
    title: text(input.title, "title"),
    description: text(input.description, "description"),
    type: text(input.type, "type"),
    tags: [...tags],
    paths: [...paths],
  };
}
export async function newSettingsJson(input = {}) {
  const folder = path.resolve(text(input.path, "path"));
  const file = input.fileName ?? "rab.settings.json";
  if (
    typeof file !== "string" ||
    path.basename(file) !== file ||
    !file.endsWith(".json")
  )
    throw new TypeError("fileName must be a JSON filename");
  const settings = { ...(await createSettings(input)), path: folder, file };
  await mkdir(folder, { recursive: true });
  const output = path.join(folder, file);
  await writeFile(output, JSON.stringify(settings, null, 2) + "\n", {
    flag: "wx",
  });
  return settings;
}



export const executeTool = async (settings) => ({ return_type: "settings", status: "complete", settings, response: await newSettingsJson(settings) });

export const run = async (settings = {}) => {
  let result;
  try {
    result = { ...await executeTool(settings), return_type: "settings" };
  } catch (error) {
    result = { return_type: "settings", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
  try {
    const { finishToolUsage } = await import("../../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1791468954599, settings, result);
  } catch (error) {
    return { ...result, error: [result.error, `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`].filter(Boolean).join("\n") };
  }
};

await runToolCli(import.meta.url, run);
