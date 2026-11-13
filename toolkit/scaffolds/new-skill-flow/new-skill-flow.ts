import type { Tool as UsageTool, ToolReturn as UsageToolReturn } from "../../../Tooling.types.ts";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { projectRoot, withinProject } from "../../../../scripts/world.mjs";
import { relative, resolve, join } from "node:path";
import { parse, stringify } from "yaml";
import { generateWorldId } from "../../generators/generate-world-id/generate-world-id.ts";
import type { Tool } from "../../../Tooling.types.ts";
import type {
  NewSkillFlowProps,
  NewSkillFlowRecord,
} from "./new-skill-flow.types.ts";

const reference = (
  value: Record<string, unknown>,
  label: string,
  allowUse = false,
) => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error(`${label} must refer to a numeric House ID`);
  const keys = allowUse ? ["id", "use"] : ["id"];
  const present = keys.filter((key) => value[key] !== undefined);
  if (
    !present.length ||
    present.some(
      (key) => !Number.isSafeInteger(value[key]) || Number(value[key]) <= 0,
    )
  )
    throw Error(`${label} must refer to a numeric House ID`);
  return Object.fromEntries([
    ...present.map((key) => [key, value[key]]),
    ...(value.reason !== undefined ? [["reason", value.reason]] : []),
  ]);
};
export async function newSkillFlow(
  input: NewSkillFlowProps,
): Promise<NewSkillFlowRecord> {
  for (const key of [
    "name",
    "title",
    "description",
    "path",
    "instructions",
  ] as const)
    if (typeof input?.[key] !== "string" || !input[key].trim())
      throw Error(`Supply ${key}`);
  const template = parse(
    await readFile(new URL("./template/skill.yaml", import.meta.url), "utf8"),
  );
  const intent = input.intent ?? "use";
  if (!["use", "enhance"].includes(intent)) throw Error("Invalid intent");
  const file = input.file ?? `${intent}.skill.yaml`;
  if (!["use.skill.yaml", "enhance.skill.yaml"].includes(file))
    throw Error("Unsupported skill filename");
  if (file !== `${intent}.skill.yaml`)
    throw Error("Skill filename must match intent");
  const owner =
    input.owner === undefined
      ? undefined
      : reference(input.owner as Record<string, unknown>, "owner");
  const implementation = (input.implementation ?? []).map((item) =>
    reference(item as Record<string, unknown>, "implementation"),
  );
  const context = (input.context ?? []).map((item) =>
    reference(item as Record<string, unknown>, "context", true),
  );
  const provenance = (input.provenance ?? []).map((item) =>
    reference(item as Record<string, unknown>, "provenance"),
  );
  const supplied = Object.fromEntries(
    Object.entries(input).filter(
      ([key, value]) => key !== "file" && value !== undefined,
    ),
  );
  const folder = resolve(projectRoot, input.path);
  if (!withinProject(projectRoot, folder)) throw Error("Skills must stay inside this world.");
  const record = {
    ...template,
    ...supplied,
    id: input.id ?? generateWorldId().id,
    path: relative(projectRoot, folder).replaceAll("\\", "/") || ".",
    intent,
    tags: input.tags ?? [],
    owner,
    implementation,
    context,
    provenance,
  } as NewSkillFlowRecord;
  if (!input.owner) delete record.owner;
  await mkdir(folder, { recursive: true });
  await writeFile(
    join(folder, file),
    stringify(record, { lineWidth: 100 }),
    { flag: "wx" },
  );
  return record;
}
export const executeTool: Tool = async (settings) => {
  try {
    return { return_type: "scaffold",
      status: "complete",
      settings,
      response: await newSkillFlow(settings as unknown as NewSkillFlowProps),
    };
  } catch (error) {
    return { return_type: "scaffold",
      status: "error",
      settings,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const run: UsageTool = async (settings) => {
  let result: UsageToolReturn;
  try {
    result = { ...await executeTool(settings), return_type: "scaffold" as const };
  } catch (error) {
    result = { return_type: "scaffold", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
  try {
    const { finishToolUsage } = await import("../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1791853637888, settings, result);
  } catch (error) {
    return { ...result, error: [result.error, `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`].filter(Boolean).join("\n") };
  }
};
