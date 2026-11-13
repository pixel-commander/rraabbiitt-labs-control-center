import { mkdir, readFile, readdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { HouseKeys, PathsProps } from "../../../HouseKeys.types.ts";

let previousId = 0;

export interface Artifact {
  path: string;
  text: string;
}
export function createScaffold(moduleUrl: string) {
  const folder = path.dirname(fileURLToPath(moduleUrl));
  const slug = (name: string) =>
    name
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .toLowerCase();
  function pascalCase(value: unknown): string {
    const words =
      String(value ?? "")
        .normalize("NFKD")
        .replace(/\p{M}+/gu, "")
        .replace(/([\p{Ll}\p{N}])([\p{Lu}])/gu, "$1 $2")
        .replace(/([\p{Lu}])([\p{Lu}][\p{Ll}])/gu, "$1 $2")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => {
          const [first, ...rest] = [...word];
          return `${first!.toLocaleUpperCase("en-US")}${rest.join("").toLocaleLowerCase("en-US")}`;
        })
        .join("") || "Item";
    const identifier = /^\p{L}/u.test(words) ? words : `N${words}`;
    return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(identifier)
      ? `Item${identifier}`
      : identifier;
  }
  function render(text: string, values: Record<string, string>): string {
    return text.replace(/__([A-Z_]+)__/g, (match, key: string) => {
      if (!Object.hasOwn(values, key))
        throw new Error(`Unbound template marker: ${key}`);
      return values[key];
    });
  }
  async function template(
    relative: string,
    values: Record<string, string> = {},
  ) {
    return render(
      await readFile(path.join(folder, "template", relative), "utf8"),
      values,
    );
  }
  async function tree(
    relative: string,
    values: Record<string, string> = {},
  ): Promise<Artifact[]> {
    const root = path.join(folder, "template", relative);
    const output: Artifact[] = [];
    async function walk(dir: string, prefix = "") {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        if (entry.isSymbolicLink())
          throw new Error("Template symlinks are not supported");
        const full = path.join(dir, entry.name);
        const name = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) await walk(full, name);
        else
          output.push({
            path: name,
            text: render(await readFile(full, "utf8"), values),
          });
      }
    }
    await walk(root);
    return output;
  }
  function validate<T extends HouseKeys>(
    input: T,
    nameKind: "pascal" | "kebab" = "pascal",
  ): T {
    const values = input as unknown as Record<string, unknown>;
    if (typeof input.path !== "string" || !path.isAbsolute(input.path))
      throw new Error("path is required");
    const name = nameKind === "kebab" ? input.name : pascalCase(input.name);
    if (
      typeof name !== "string" ||
      (nameKind === "kebab" && !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name))
    )
      throw new Error("name must be lowercase kebab-case");
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name))
      throw new Error("Reserved filesystem name");
    for (const key of [
      "title",
      "description",
      "content",
      "styles",
      "class_name",
      "label",
    ])
      if (values[key] !== undefined && typeof values[key] !== "string")
        throw new Error(`${key} must be text`);
    if (
      values.tags !== undefined &&
      (!Array.isArray(values.tags) ||
        values.tags.some((tag) => typeof tag !== "string"))
    )
      throw new Error("tags must be strings");
    if (
      values.save_as_text !== undefined &&
      typeof values.save_as_text !== "boolean"
    )
      throw new Error("save_as_text must be boolean");
    return name === input.name ? input : { ...input, name };
  }
  function record(
    input: HouseKeys,
    type: string,
    extra: Record<string, unknown> = {},
  ) {
    return {
      id: (previousId = Math.max(Date.now(), previousId + 1)),
      name: input.name,
      title: input.title ?? input.name,
      description: input.description ?? "",
      type,
      tags: (input as HouseKeys & { tags?: string[] }).tags ?? ["react", type],
      ...extra,
    };
  }
  async function publish<
    T extends HouseKeys & { file?: string; name: string; type?: string },
  >(
    parent: string,
    name: string,
    saved: T,
    artifacts: Artifact[],
    directories: string[] = [],
  ): Promise<T> {
    const absoluteParent = path.resolve(parent);
    try {
      await stat(absoluteParent);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await mkdir(absoluteParent, { recursive: true });
    }
    const destination = path.join(absoluteParent, name);
    try {
      await mkdir(destination); // Exclusive: an existing destination is never replaced.
      for (const directory of directories)
        await mkdir(path.join(destination, directory), { recursive: true });
      let recordRoot = destination;
      if (saved.type !== "project") {
        recordRoot = absoluteParent;
        while (true) {
          let registered = false;
          for (const manifest of ["rab.project.json", "rab.world.json"]) {
            try {
              const project = JSON.parse(await readFile(path.join(recordRoot, manifest), "utf8"));
              if (project.type === "project" || (manifest === "rab.world.json" && typeof project.id === "number")) {
                registered = true;
                break;
              }
            } catch (error) {
              if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
            }
          }
          if (registered) break;
          const up = path.dirname(recordRoot);
          if (up === recordRoot)
            throw new Error(
              "No project settings found above scaffold destination",
            );
          recordRoot = up;
        }
      }
      const seen = new Set<string>();
      const written: string[] = [];
      for (const artifact of artifacts.filter(
        (item) => item.path !== "rab.settings.json",
      )) {
        const rel = artifact.path.replaceAll("\\", "/");
        if (
          path.isAbsolute(rel) ||
          rel.split("/").some((part) => !part || part === ".." || part === ".")
        )
          throw new Error(`Unsafe artifact path: ${rel}`);
        if (seen.has(rel.toLowerCase()))
          throw new Error(`Duplicate artifact path: ${rel}`);
        seen.add(rel.toLowerCase());
        written.push(rel);
        const target = path.join(destination, rel);
        await mkdir(path.dirname(target), { recursive: true });
        let text = artifact.text;
        if (path.basename(artifact.path) === "rab.settings.json") {
          const nested = JSON.parse(text) as HouseKeys & {
            file?: string;
            paths?: PathsProps[];
          };
          const nestedDir = path.dirname(artifact.path);
          nested.path =
            path
              .relative(recordRoot, path.join(destination, nestedDir))
              .replaceAll("\\", "/") || ".";
          text = `${JSON.stringify(nested, null, 2)}\n`;
        }
        await writeFile(target, text, { flag: "wx" });
      }
      saved.path =
        path.relative(recordRoot, destination).replaceAll("\\", "/") || ".";
      const settingsFile =
        saved.type === "project" ? "rab.project.json" : "rab.settings.json";
      const setting = `${JSON.stringify(saved, null, 2)}\n`;
      await writeFile(path.join(destination, settingsFile), setting, {
        flag: "wx",
      });
      const inventory: PathsProps[] = [...written, settingsFile]
        .sort()
        .map((file) => ({
          path:
            path
              .relative(recordRoot, path.dirname(path.join(destination, file)))
              .replaceAll("\\", "/") || ".",
          file: path.basename(file),
          type: "file",
        }));
      return { ...saved, paths: inventory };
    } catch (error) {
      throw error;
    }
  }
  async function gridAttribute(name?: string) {
    if (!name) return "";
    const catalog = path.join(folder, "template", "grid.css");
    const css = await readFile(catalog, "utf8");
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`data-grid=['\"]${escaped}['\"]`).test(css))
      throw new Error(`Unknown canonical grid: ${name}`);
    return ` data-grid=${JSON.stringify(name)}`;
  }

  return {
    folder,
    slug,
    pascalCase,
    render,
    template,
    tree,
    validate,
    record,
    publish,
    gridAttribute,
  };
}
