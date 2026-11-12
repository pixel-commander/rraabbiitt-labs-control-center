import { ensureSearchSchema } from "../toolkit/tools/refresh-world-database/ensure-search-schema.ts";
import { DatabaseSync } from "node:sqlite";
import { existsSync, readFileSync, copyFileSync, mkdirSync, constants } from "node:fs";
import { run as newDatabase } from "../toolkit/tools/new-sqlite-db/new-sqlite-db.mjs";
import { run as newTable } from "../toolkit/tools/new-db-table/new-db-table.mjs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const folder = fileURLToPath(new URL("./main/", import.meta.url));
const tables = ["records", "messages", "docs", "tool_calls", "runs", "favorites"];
if (!existsSync(folder)) {
  const base = fileURLToPath(new URL("./base/app.sqlite", import.meta.url));
  if (existsSync(base)) {
    mkdirSync(folder);
    // Exclusive copy: never replace an existing working database, even in a race.
    copyFileSync(base, path.join(folder, "app.sqlite"), constants.COPYFILE_EXCL);
  } else {
  const result = await newDatabase({
    path: path.dirname(folder),
    name: "main",
    file: "app.sqlite",
  });
  if (result.status !== "complete") throw new Error(result.error);
  }
}
if (!existsSync(path.join(folder, "app.sqlite"))) {
  throw new Error(
    "db/main exists without app.sqlite; refusing to overwrite its contents.",
  );
}
for (const name of tables) {
  const inspect = new DatabaseSync(path.join(folder, "app.sqlite"));
  let present;
  try {
    present = inspect
      .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?")
      .get(name);
  } finally {
    inspect.close();
  }
  if (!present) {
    const result = await newTable({ path: folder, file: "app.sqlite", name });
    if (result.status !== "complete") throw new Error(result.error);
  }
}
const db = new DatabaseSync(path.join(folder, "app.sqlite"));
try {
  db.exec("PRAGMA busy_timeout=5000; BEGIN IMMEDIATE");
  db.exec(readFileSync(new URL("../api/tool-usage/schema.sql", import.meta.url), "utf8"));
  ensureSearchSchema(db);
  for (const name of tables) {
    const columns = db.prepare(`PRAGMA table_info(${name})`).all();
    const expected = [
      "id",
      "name",
      "title",
      "type",
      "description",
      "tags",
      "file",
      "path",
      "paths",
    ];
    if (name === "records") expected.push("data");
    if (
      columns.length !== expected.length ||
      columns.some((column, i) => column.name !== expected[i])
    ) {
      throw new Error(
        `Unexpected schema for ${name}; no automatic migration was applied.`,
      );
    }
  }
  db.exec("COMMIT");
  console.log(`Database ready: db/main/app.sqlite (${tables.join(", ")}).`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
