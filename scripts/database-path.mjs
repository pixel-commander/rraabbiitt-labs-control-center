import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

/** Read the database location from rab.world.json (the single source of truth). */
export async function databaseFromWorld(worldPath) {
  const world = JSON.parse(
    (await readFile(resolve(worldPath, "rab.world.json"), "utf8")).replace(/^\uFEFF/, "")
  );
  const entries = (world.paths ?? []).filter((e) => e.name === "database");
  if (entries.length !== 1 || !entries[0].path || !entries[0].file)
    throw new Error("Register exactly one database in rab.world.json.");
  return {
    folder: resolve(worldPath, entries[0].path),
    file: resolve(worldPath, entries[0].path, entries[0].file),
    entry: entries[0],
  };
}
