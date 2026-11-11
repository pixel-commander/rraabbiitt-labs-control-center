import type { Tool as UsageTool, ToolReturn as UsageToolReturn } from "../../Tooling.types.ts";
import { mkdir, copyFile } from "node:fs/promises";
import { constants } from "node:fs";
import { isAbsolute, join, basename } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { GenerateWorldDatabaseProps } from "./generate-world-database.types.ts";
import type { ToolReturn } from "../../Tooling.types.ts";
export async function executeTool(
  settings: GenerateWorldDatabaseProps,
): Promise<ToolReturn> {
  try {
    if (typeof settings?.path !== "string" || !isAbsolute(settings.path))
      throw new TypeError("path must be an absolute database directory");
    const file = settings.file ?? "catalog.sqlite";
    if (
      typeof file !== "string" ||
      !file ||
      basename(file) !== file ||
      file.includes(":")
    )
      throw new TypeError("file must be a filename");
    const source = new URL("./template/catalog.sqlite", import.meta.url);
    const database = new DatabaseSync(source, { readOnly: true });
    try {
      if (
        database.prepare("PRAGMA integrity_check").get()?.integrity_check !==
        "ok"
      )
        throw new Error("Template database failed integrity check");
    } finally {
      database.close();
    }
    await mkdir(settings.path, { recursive: true });
    await copyFile(source, join(settings.path, file), constants.COPYFILE_EXCL);
    return {
      return_type: "scaffold", status: "complete",
      settings,
      response: { paths: [{ path: settings.path, file, type: "sqlite" }] },
    };
  } catch (error) {
    return {
      return_type: "scaffold", status: "error",
      settings,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export const run: UsageTool = async settings => {
  let result: UsageToolReturn;
  try { result = await executeTool(settings as GenerateWorldDatabaseProps); }
  catch (error) { result = { return_type: "scaffold", status: "error", settings, error: error instanceof Error ? error.message : String(error) }; }
  try {
    const { finishToolUsage } = await import("../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1791834915266, settings, result);
  } catch (error) {
    return { ...result, error: [result.error, `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`].filter(Boolean).join("\n") };
  }
};
