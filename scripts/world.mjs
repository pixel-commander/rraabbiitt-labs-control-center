import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, relative, isAbsolute } from "node:path";

export const projectRoot = fileURLToPath(new URL("../", import.meta.url));
export const withinProject = (root, path) => {
  const child = relative(root, resolve(path));
  return child !== ".." && !child.startsWith("../") && !child.startsWith("..\\") && !isAbsolute(child);
};

/** The manifest's actual containing folder owns all application locations. */
export async function loadWorld() {
  const world = JSON.parse(await readFile(new URL("../rab.world.json", import.meta.url), "utf8"));
  if (resolve(projectRoot, world.path ?? ".") !== resolve(projectRoot))
    throw new Error("rab.world.json path must identify this folder; use '.'.");
  for (const entry of [...world.paths, ...world.toolkits, world.mcp]) {
    if (!entry || typeof entry.path !== "string" || !withinProject(projectRoot, resolve(projectRoot, entry.path)))
      throw new Error("Registered runtime locations must remain inside this project.");
  }
  return { ...world, path: resolve(projectRoot) };
}
