import { DatabaseSync, backup } from "node:sqlite";
import { mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";
import { projectRoot } from "./world.mjs";

// Build a distribution database without changing the working database.
const temporaryRoot = resolve(projectRoot, ".tmp/database-base");
await mkdir(temporaryRoot, {recursive: true});
const folder = await mkdtemp(resolve(temporaryRoot, "build-"));
try {
  const file = resolve(folder, "app.sqlite");
  const source = new DatabaseSync(resolve(projectRoot, "db/main/app.sqlite"), {readOnly: true});
  try { await backup(source, file); } finally { source.close(); }
  const db = new DatabaseSync(file);
  try {
    db.exec("PRAGMA foreign_keys=ON; BEGIN IMMEDIATE");
    for (const table of ["tool_usage", "tool_calls", "runs", "messages", "docs", "favorites"])
      db.exec(`DELETE FROM ${table}`);
    db.exec("DELETE FROM records WHERE json_extract(data, '$.record_key') IS NULL");
    const count = db.prepare("SELECT count(*) AS count FROM records").get().count;
    if (!count) throw Error("Base database must contain source records. Run npm run db:refresh first.");
    db.exec("COMMIT; VACUUM");
    console.log(`Base database: ${count} source records; application history excluded.`);
  } finally { db.close(); }
  const destination = resolve(projectRoot, "db/base");
  await mkdir(destination, {recursive: true});
  await rename(file, resolve(destination, "app.sqlite"));
} finally {
  const child = relative(temporaryRoot, resolve(folder));
  if (!child || child.startsWith("..") || isAbsolute(child)) throw Error("Unsafe temporary database cleanup.");
  await rm(folder, {recursive: true, force: true});
}
