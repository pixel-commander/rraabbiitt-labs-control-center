import type { ToolsProps, ToolReturn } from "../../../Tooling.types.ts";
import { readdir, readFile, realpath, stat } from "node:fs/promises";
import { resolve, relative, isAbsolute, extname } from "node:path";
import { fileURLToPath } from "node:url";
import type { CssAtom, ListCssAtomsSettings, ListCssAtomsReturn } from "./list-css-atoms.types.ts";

export const executeTool = async (settings: ListCssAtomsSettings = {}): Promise<ListCssAtomsReturn> => {
  try {
    const categories = ["container", "action", "effect", "grid"] as const;
    if (settings.type !== undefined && !categories.includes(settings.type)) throw Error("type must be container, action, effect, or grid.");
    if (settings.query !== undefined && typeof settings.query !== "string") throw Error("query must be a string.");
    if (settings.path !== undefined && typeof settings.path !== "string") throw Error("path must be an atoms directory.");
    const root = await realpath(settings.path ?? fileURLToPath(new URL("../../../../src/atoms", import.meta.url)));
    const atoms: CssAtom[] = [];
    const inside = (path: string) => { const child = relative(root, path); return child !== ".." && !child.startsWith("../") && !child.startsWith("..\\") && !isAbsolute(child); };
    const visit = async (folder: string): Promise<void> => {
      const entries = await readdir(folder, { withFileTypes: true });
      if (entries.some(entry => entry.isFile() && entry.name === "rab.settings.json")) {
        const record = JSON.parse(await readFile(resolve(folder, "rab.settings.json"), "utf8"));
        if (["ui-atom", ...categories, ...categories.map(value => `${value}s`)].includes(record.type)) {
          const type = categories.find(value => record.type === value || record.type === `${value}s` || record.tags?.includes(value) || record.name?.startsWith(`${value}-`));
          const file = record.file ?? `${record.name}.css`;
          if (!type || typeof record.name !== "string" || typeof file !== "string" || extname(file) !== ".css") throw Error(`Invalid CSS atom metadata: ${folder}`);
          const cssPath = await realpath(resolve(folder, file));
          if (!inside(cssPath) || !(await stat(cssPath)).isFile()) throw Error(`Atom CSS must remain inside ${root}.`);
          atoms.push({ id: record.id, name: record.name, title: record.title, description: record.description,
            tags: record.tags, type, class_name: record.name, path: folder, file });
        }
      }
      for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        if (entry.isDirectory() && !["node_modules", ".git", "demo", "template", "templates"].includes(entry.name)) await visit(resolve(folder, entry.name));
      }
    };
    await visit(root);
    const terms = settings.query?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];
    const paths = atoms.filter(atom => (!settings.type || atom.type === settings.type) && terms.every(term =>
      [atom.name, atom.title, atom.description, atom.type, ...(atom.tags ?? [])].join(" ").toLowerCase().includes(term)))
      .sort((a, b) => a.type.localeCompare(b.type) || a.name!.localeCompare(b.name!));
    return { return_type: "results", status: "complete", settings,
      response: { response_type: "list", path: root, paths, summary: { count: paths.length, total: atoms.length } } };
  } catch (error) {
    return { return_type: "results", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
};

/** @param {ToolsProps} props @returns {Promise<ToolReturn>} */
export const run = async (props: ToolsProps): Promise<ToolReturn> => {
  const settings = props;
  /** @type {ToolReturn} */
  let result: ToolReturn;
  try {
    result = await executeTool(props as ListCssAtomsSettings);
  } catch (error) {
    result = { return_type: "results", status: "error", settings,
      error: error instanceof Error ? error.message : String(error) };
  }
  // Usage fires once, after the work and before return. No console output.
  try {
    const { finishToolUsage } = await import("../../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1794610890789, settings, result);
  } catch (error) {
    return { ...result, error: [result.error,
      `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`]
      .filter(Boolean).join("\n") };
  }
};
