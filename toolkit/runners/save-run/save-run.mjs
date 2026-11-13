import { DatabaseSync } from "node:sqlite";
import { readFile, realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { withinProject } from "../../scripts/world.mjs";

/**
 * Writes a finished run into the main database:
 *   - one summary row in runs
 *   - one row per step in tool_calls (linked by run_id)
 * Best-effort. Never throws to the caller.
 * The side tool_usage log (written by finishToolUsage) is left alone as a backup.
 */
export async function saveRun(world, steps) {
  if (!Array.isArray(steps) || steps.length === 0) return;
  let db;
  try {
    const worldFile = JSON.parse(
      (await readFile(resolve(world.path, "rab.world.json"), "utf8")).replace(/^\uFEFF/, "")
    );
    const entries = worldFile.paths?.filter((row) => row.name === "database");
    if (entries?.length !== 1) return;
    const file = await realpath(resolve(world.path, entries[0].path, entries[0].file));
    if (!withinProject(world.path, file)) return;

    db = new DatabaseSync(file);
    db.exec("PRAGMA busy_timeout=1000");

    // Ensure tables exist (tool_calls may need a run_id column)
    db.exec(`
      CREATE TABLE IF NOT EXISTS runs (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT, title TEXT, type TEXT, description TEXT,
        tags TEXT DEFAULT '[]', file TEXT, path TEXT, paths TEXT DEFAULT '[]'
      );
      CREATE TABLE IF NOT EXISTS tool_calls (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT, title TEXT, type TEXT, description TEXT,
        tags TEXT DEFAULT '[]', file TEXT, path TEXT, paths TEXT DEFAULT '[]'
      );
    `);
    // Add run_id if the table already existed without it
    const cols = db.prepare("PRAGMA table_info(tool_calls)").all();
    if (!cols.some((c) => c.name === "run_id")) {
      try { db.exec("ALTER TABLE tool_calls ADD COLUMN run_id INTEGER"); } catch { /* already present or locked */ }
    }

    const top = steps[0] ?? {};
    const start = steps.reduce((min, s) => {
      const t = s.date_start;
      return Number.isFinite(t) && t < min ? t : min;
    }, Infinity);
    const end = steps.reduce((max, s) => {
      const t = s.date_end;
      return Number.isFinite(t) && t > max ? t : max;
    }, 0);
    const safeStart = Number.isFinite(start) ? start : null;
    const safeEnd = end > 0 ? end : null;
    const duration = safeStart != null && safeEnd != null ? safeEnd - safeStart : null;
    const status = steps.every((s) => s.status === "complete") ? "complete" : "error";

    const runId = Date.now();
    const name = top.name ?? "run";
    const title = top.title ?? name;

    const summary = {
      id: runId,
      name,
      title,
      type: "run",
      start: safeStart,
      end: safeEnd,
      duration,
      status,
    };

    db.prepare(
      `INSERT INTO runs (id, name, title, type, description, tags, file, path, paths)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(runId, name, title, "run", JSON.stringify(summary), "[]", null, null, "[]");

    const insertStep = db.prepare(
      `INSERT INTO tool_calls (id, name, title, type, description, tags, file, path, paths, run_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const s of steps) {
      const stepId = Date.now() + Math.floor(Math.random() * 1000); // simple unique
      const stepDuration = Number.isFinite(s.date_start) && Number.isFinite(s.date_end)
        ? s.date_end - s.date_start
        : null;
      const stepRecord = {
        id: stepId,
        run_id: runId,
        name: s.name,
        title: s.title,
        type: s.type,
        start: s.date_start ?? null,
        end: s.date_end ?? null,
        duration: stepDuration,
        status: s.status,
        settings: s.settings,
        response: s.response,
        error: s.error,
      };
      insertStep.run(
        stepId,
        s.name ?? null,
        s.title ?? null,
        s.type ?? "tool",
        JSON.stringify(stepRecord),
        "[]",
        null,
        null,
        "[]",
        runId
      );
    }
  } catch (error) {
    console.warn("saveRun failed:", error instanceof Error ? error.message : String(error));
  } finally {
    db?.close();
  }
}
