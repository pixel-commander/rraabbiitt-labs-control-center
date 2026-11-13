import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

export const toolkitRoot = fileURLToPath(new URL("../../../", import.meta.url));

/** Resolve a stable House ID through the project's registered tool catalog. */
export const resolveRunner = async (id: number, root = toolkitRoot) => {
  let project;
  try {
    project = JSON.parse(await readFile(resolve(root, "rab.project.json"), "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    project = JSON.parse(await readFile(resolve(root, "rab.world.json"), "utf8"));
  }
  const databases = project.paths.filter((entry: { name?: string }) => entry.name === "database");
  if (databases.length !== 1) throw Error("Register exactly one project database.");
  const database = databases[0];
  if (!database?.path || !database.file) throw Error("Toolkit catalog registration is missing.");
  const db = new DatabaseSync(resolve(root, database.path, database.file), { readOnly: true });
  let registration: { path: string; file: string } | undefined;
  try {
    registration = db.prepare("SELECT path, file FROM records WHERE json_extract(data, '$.id') = ?").get(id) as typeof registration;
  } finally {
    db.close();
  }
  if (!registration) throw Error(`Runner ${id} is missing from the catalog.`);
  const entry = resolve(root, registration.path, registration.file);
  const local = relative(root, entry);
  if (local.startsWith("..") || isAbsolute(local)) throw Error("Runner is outside its registered toolkit root.");
  const metadata = JSON.parse(await readFile(resolve(dirname(entry), "rab.settings.json"), "utf8"));
  if (metadata.id !== id || metadata.type !== "runner") throw Error("Catalog runner identity does not match its current metadata.");
  return entry;
};
