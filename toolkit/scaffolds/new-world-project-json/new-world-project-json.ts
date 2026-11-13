import type { Tool as UsageTool, ToolReturn as UsageToolReturn } from "../../../Tooling.types.ts";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { generateWorldId } from "../../generators/generate-world-id/generate-world-id.ts";
import type { NewWorldProjectJsonProps, NewWorldProjectJsonRecord } from "./new-world-project-json.types.ts";

export const newWorldProjectJson = async (
  input: NewWorldProjectJsonProps,
): Promise<NewWorldProjectJsonRecord> => {
  for (const key of ["path", "name"] as const) {
    if (typeof input?.[key] !== "string" || !input[key].trim()) {
      throw new TypeError(`Supply ${key}`);
    }
  }
  const template = JSON.parse(
    await readFile(new URL("./template/rab.project.json", import.meta.url), "utf8"),
  );
  const supplied = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  const record = {
    ...template,
    ...supplied,
    id: input.id ?? generateWorldId().id,
  } as NewWorldProjectJsonRecord;
  const destination = resolve(input.path);
  await mkdir(destination, { recursive: true });
  await writeFile(
    join(destination, "rab.project.json"),
    `${JSON.stringify(record, null, 2)}\n`,
    { flag: "wx" },
  );
  return record;
};

const executeTool: UsageTool = async (settings) => ({ return_type: "scaffold", status: "complete", settings, response: await newWorldProjectJson(settings as unknown as NewWorldProjectJsonProps) });

export const run: UsageTool = async (settings) => {
  let result: UsageToolReturn;
  try {
    result = { ...await executeTool(settings), return_type: "scaffold" as const };
  } catch (error) {
    result = { return_type: "scaffold", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
  try {
    const { finishToolUsage } = await import("../../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1793984237830, settings, result);
  } catch (error) {
    return { ...result, error: [result.error, `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`].filter(Boolean).join("\n") };
  }
};
