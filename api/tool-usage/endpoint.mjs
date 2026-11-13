import { DatabaseSync } from "node:sqlite";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

/** Read the saved audit data without executing tools or changing the database. */
export async function readUsage(world) {
  let db;
  try {
    const project = JSON.parse(await readFile(resolve(world.path, "rab.world.json"), "utf8"));
    const entries = project.paths?.filter(entry => entry.name === "database");
    if (entries?.length !== 1 || !entries[0].path || !entries[0].file) throw Error("Database registration is missing.");
    db = new DatabaseSync(resolve(world.path, entries[0].path, entries[0].file), { readOnly: true });
    db.exec("PRAGMA busy_timeout=1000");
    const exists = name => !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
    const tools = exists("tool_usage") ? db.prepare(`SELECT u.id, COALESCE(r.name, CAST(u.id AS TEXT)) AS name,
      COUNT(*) AS calls, MIN(u.date) AS first, MAX(u.date) AS last
      FROM tool_usage u LEFT JOIN records r ON r.id=u.id GROUP BY u.id ORDER BY calls DESC, name`).all() : [];
    const runs = exists("runs") ? db.prepare("SELECT id,name,title,description FROM runs ORDER BY id DESC").all().map(row => {
      let report = {};
      try { report = JSON.parse(row.description ?? "{}"); } catch { /* Older records may use prose. */ }
      return { id: row.id, name: row.name ?? row.title ?? String(row.id), status: report?.status ?? "unknown",
        start: Number.isFinite(report?.date_start) ? report.date_start : null,
        end: Number.isFinite(report?.date_end) ? report.date_end : null,
        steps: Array.isArray(report?.branches) ? report.branches.length : null,
        warnings: Array.isArray(report?.errors) ? report.errors.length : 0 };
    }) : [];
    const days = new Map();
    const hours = Array.from({ length: 24 }, (_, hour) => ({ date: `${String(hour).padStart(2,"0")}:00`, calls: 0, runs: 0 }));
    const hourFormat = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "2-digit", hourCycle: "h23" });
    const dateFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" });
    const bucket = timestamp => {
      const date = dateFormat.format(new Date(timestamp));
      if (!days.has(date)) days.set(date, { date, calls: 0, runs: 0 });
      return days.get(date);
    };
    if (exists("tool_usage")) for (const row of db.prepare("SELECT date, COUNT(*) AS calls FROM tool_usage GROUP BY date").iterate()) { bucket(row.date).calls += row.calls; hours[Number(hourFormat.format(new Date(row.date)))].calls += row.calls; }
    for (const run of runs) if (run.start !== null) { bucket(run.start).runs++; hours[Number(hourFormat.format(new Date(run.start)))].runs++; }
    return { code: 200, body: { tools, runs, days: [...days.values()].sort((a,b) => a.date.localeCompare(b.date)),
      hours: days.size === 1 ? hours : [], totalCalls: tools.reduce((sum, tool) => sum + tool.calls, 0), updated: Date.now() } };
  } catch (error) { return { code: 503, body: { error: error.message } }; }
  finally { db?.close(); }
}

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
    const project = JSON.parse(await readFile(resolve(world.path, "rab.world.json"), "utf8"));
    const entries = project.paths?.filter(entry => entry.name === "database");
    if (entries?.length !== 1 || !entries[0].path || !entries[0].file)
      throw new Error("Database path and file are missing from rab.world.json.");
    const file = resolve(world.path, entries[0].path, entries[0].file);
    if (!(await stat(file)).isFile()) throw new Error("Usage database is not a file.");
    db = new DatabaseSync(file);
    db.exec("PRAGMA busy_timeout=0");
    db.exec(`CREATE TABLE IF NOT EXISTS tool_usage (
      id INTEGER NOT NULL,
      date INTEGER NOT NULL,
      message INTEGER
    )`);
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

/** Tool entry for the master runner. */
export const run = async (props) => {
  const settings = props.settings ?? props;
  const world = props.world ?? props;
  // Prefer the existing readUsage / recordUsage paths
  if (settings.action === "record" || settings.record === true) {
    // recordUsage is loaded dynamically in the old handler; expose a simple wrapper
    const result = await readUsage(world);
    return {
      return_type: "summary",
      status: result.code >= 200 && result.code < 300 ? "complete" : "error",
      settings,
      response: result.body,
      error: result.body?.error,
    };
  }
  const result = await readUsage(world);
  return {
    return_type: "summary",
    status: result.code >= 200 && result.code < 300 ? "complete" : "error",
    settings,
    response: result.body,
    error: result.body?.error,
  };
};
