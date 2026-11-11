import { DatabaseSync } from "node:sqlite";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

/** HTTP owner: accepts the agreed three fields and appends one usage event. */
export async function recordUsage(world, settings) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings) ||
      Object.keys(settings).some(key => !["id", "date", "message"].includes(key)) ||
      !Number.isSafeInteger(settings.id) || !Number.isSafeInteger(settings.date) ||
      (settings.message !== undefined && !Number.isSafeInteger(settings.message))) {
    return { code: 400, body: { return_type: "api-call", status: "error", settings,
      error: "Supply numeric id and date, and an optional numeric database message ID." } };
  }
  let db;
  try {
    const project = JSON.parse(await readFile(resolve(world.path, "rab.project.json"), "utf8"));
    const entries = project.paths?.filter(entry => entry.name === "database");
    if (entries?.length !== 1 || !entries[0].path || !entries[0].file)
      throw new Error("Database path and file are missing from rab.project.json.");
    const file = resolve(world.path, entries[0].path, entries[0].file);
    if (!(await stat(file)).isFile()) throw new Error("Usage database is not a file.");
    const schema = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
    db = new DatabaseSync(file);
    db.exec("PRAGMA busy_timeout=0");
    db.exec(schema);
    db.prepare("INSERT INTO tool_usage (id,date,message) VALUES (?,?,?)")
      .run(settings.id, settings.date, settings.message ?? null);
    return { code: 200, body: { return_type: "api-call", status: "complete", settings } };
  } catch (error) {
    return { code: 503, body: { return_type: "api-call", status: "error", settings,
      error: error instanceof Error ? error.message : String(error) } };
  } finally {
    db?.close();
  }
}
