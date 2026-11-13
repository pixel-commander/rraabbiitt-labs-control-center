import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { run as dispatch } from "../runner-use-tool/runner-use-tool.ts";
import { runTools } from "../run-tools.ts";
import { generateWorldId } from "../../generators/generate-world-id/generate-world-id.ts";

export const runnerId = 1794537157022;
export const refreshRunnerId = 1793984711136;
export async function saveRefreshRun(world, report) {
  let db;
  try {
    const project = JSON.parse(await readFile(resolve(world.path, "rab.project.json"), "utf8"));
    const entries = project.paths?.filter(row => row.name === "database");
    if (entries?.length !== 1 || !entries[0].path || !entries[0].file) throw Error("DB not found");
    const file = resolve(world.path, entries[0].path, entries[0].file);
    if (!(await stat(file)).isFile()) throw Error("DB not found");
    db = new DatabaseSync(file, { open: true });
    db.exec("PRAGMA busy_timeout=1000");
    db.prepare("INSERT INTO runs (id,name,title,type,description,path) VALUES (?,?,?,?,?,?)")
      .run(report.id, "world-refresh", "Refresh System", "runner", JSON.stringify(report), ".");
  } catch (error) {
    if (error.code === "ENOENT") throw Error("DB not found");
    throw error;
  } finally { db?.close(); }
}


// The existing tracker owns branch state, timing and callbacks. Never wrap
// another runner as a tool step; forward its record/update callbacks directly.
export async function run(world, options = {}, dependencies = {}) {
  const execute = dependencies.execute ?? dispatch;
  const save = dependencies.save ?? saveRefreshRun;
  const report = { id: generateWorldId().id, runner: runnerId, date_start: Date.now(), status: "complete", errors: [], branches: [] };
  try {
    report.branches = await execute(
      { id: refreshRunnerId, content: JSON.stringify({ path: world.path, type: "world" }), toolkits: world.toolkits },
      { record: options.record, update: options.update },
    );
    if (!Array.isArray(report.branches) || !report.branches.length) throw Error("Runner returned no branch results.");
    if (report.branches.some(step => !["complete", "warning"].includes(step.status))) report.status = "error";
    for (const step of report.branches) {
      if (step.error) report.errors.push(String(step.error));
      if (step.status === "warning") report.errors.push("Branch warning");
      for (const warning of [step.warnings, step.response?.warnings]) {
        if (Array.isArray(warning)) report.errors.push(...warning.map(String));
        else if (warning) report.errors.push(String(warning));
      }
    }
  } catch (error) {
    report.status = "error";
    report.errors.push(error.message);
    if (!Array.isArray(report.branches)) report.branches = [];
  }
  const finished = await runTools(
    [{ id: runnerId, type: "tool", name: "save-refresh-report", settings: { path: world.path } }],
    async step => {
      report.date_end = Date.now();
      report.database = { saved: false };
      try {
        await save(world, { ...report, database: { saved: true } });
        report.database.saved = true;
      } catch (error) {
        report.database.error = error.message;
        report.errors.push(error.message);
      }
      return {
        return_type: "summary", status: report.status, settings: step.settings,
        response: { report }, ...(report.errors.length ? { error: report.errors.join("; ") } : {}),
      };
    },
    {
      record: options.record,
      update: steps => options.update?.([...report.branches, ...steps]),
      complete: steps => options.complete?.([...report.branches, ...steps]),
    },
  );
  return [...report.branches, ...finished];
}
