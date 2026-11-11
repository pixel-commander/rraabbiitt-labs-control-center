import type { Tool as UsageTool, ToolReturn as UsageToolReturn } from "../../../Tooling.types.ts";
import {
  readFile,
  readdir,
  stat,
  writeFile,
  rename,
  unlink,
} from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { generateWorldId } from "../../generators/generate-world-id/generate-world-id.ts";
import type { ToolsProps, ToolReturn } from "../../../Tooling.types.ts";
import type { HouseKeys, PathsProps } from "../../../HouseKeys.types.ts";

const readRecord = async (file: string): Promise<HouseKeys & PathsProps> => {
  const record = JSON.parse(await readFile(file, "utf8"));
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    throw new Error(`Expected a JSON object: ${file}`);
  }
  return record;
};

const collectFiles = async (folder: string): Promise<string[]> => {
  const files: string[] = [];
  const entries = await readdir(folder, { withFileTypes: true });
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    const file = join(folder, entry.name);
    // Do not follow symlinks or junctions outside the scanned tree or into cycles.
    if (entry.isDirectory() && !entry.isSymbolicLink()) {
      files.push(...(await collectFiles(file)));
    } else if (entry.isFile()) {
      files.push(file);
    }
  }
  return files;
};

export const executeTool = async (settings: ToolsProps): Promise<ToolReturn> => {
  const targetName = "rab.settings.json";
  try {
    if (typeof settings.path !== "string" || !settings.path.trim()) {
      if (settings.id !== undefined) {
        throw new Error("ID lookup is not implemented yet. Supply path.");
      }
      throw new Error("Supply path or id; ID lookup is not implemented yet.");
    }
    const supplied = resolve(settings.path);
    const info = await stat(supplied);
    if (
      !info.isDirectory() &&
      (!info.isFile() || basename(supplied) !== targetName)
    ) {
      throw new Error(`Supply a folder or its ${targetName} file.`);
    }
    const target = info.isDirectory() ? join(supplied, targetName) : supplied;
    const record = await readRecord(target);
    const files = await collectFiles(dirname(target));
    const paths: PathsProps[] = [];
    for (const file of files) {
      paths.push({
        name: basename(file),
        path:
          relative(dirname(target), dirname(file)).replaceAll("\\", "/") || ".",
        type: extname(file).slice(1),
      });
    }
    const updated: HouseKeys & PathsProps = {
      ...record,
      id: record.id ?? generateWorldId().id,
      path: dirname(target).replaceAll("\\", "/"),
      paths,
    };
    if (updated.file === targetName) delete updated.file;
    // Finish scanning/parsing before replacing the target, so failures retain it.
    const temporary = `${target}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, `${JSON.stringify(updated, null, 2)}\n`, {
        flag: "wx",
      });
      await rename(temporary, target);
    } finally {
      await unlink(temporary).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      });
    }
    return { return_type: "settings",
      status: "complete",
      settings,
      response: { ...updated, summary: { count: paths.length } },
    };
  } catch (error) {
    return { return_type: "settings",
      status: "error",
      settings,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};


export const run: UsageTool = async (settings) => {
  let result: UsageToolReturn;
  try {
    result = { ...await executeTool(settings), return_type: "settings" as const };
  } catch (error) {
    result = { return_type: "settings", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
  try {
    const { finishToolUsage } = await import("../../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1793981263000, settings, result);
  } catch (error) {
    return { ...result, error: [result.error, `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`].filter(Boolean).join("\n") };
  }
};
