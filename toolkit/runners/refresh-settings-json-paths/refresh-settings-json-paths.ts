import { readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { RunnersProps, RunnerCallbacks, RunnerReturn, RunProps } from "../../Runner.types.ts";
import { runTools } from "../run-tools.ts";
import { run as refreshSettings } from "../../tools/refresh-settings-json/refresh-settings-json.ts";

export const run = async (
  props: RunnersProps,
  options: RunnerCallbacks = {},
): Promise<RunnerReturn> => {
  const settings = { ...props };
  return runTools(
    async (): Promise<RunProps[]> => {
      if (typeof settings.path !== "string" || !settings.path.trim())
        throw new Error("Supply path as the folder to search.");
      const root = resolve(settings.path);
      if (!(await stat(root)).isDirectory())
        throw new Error("path must be a folder.");
      const locations: string[] = [];
      const collect = async (folder: string): Promise<void> => {
        const entries = await readdir(folder, { withFileTypes: true });
        entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
        for (const entry of entries) {
          if (entry.isSymbolicLink()) continue;
          if (entry.isFile() && entry.name === "rab.settings.json")
            locations.push(folder);
          else if (entry.isDirectory()) await collect(join(folder, entry.name));
        }
      };
      await collect(root);
      return locations.map(path => ({
        type: "tool",
        name: "refresh-settings-json",
        settings: { ...settings, path },
      }));
    },
    step => refreshSettings(step.settings),
    options,
  );
};
