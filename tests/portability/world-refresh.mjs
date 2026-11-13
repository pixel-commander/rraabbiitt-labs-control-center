import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { run, refreshRunnerId } from "../../toolkit/runners/runner-refresh-system/runner-refresh-system.mjs";
const refreshWorld = async (world, dependencies) => (await run(world, {}, dependencies)).at(-1).response.report;
import { createWorldRefreshHandler, refreshSystemRunnerId } from "../../api/world-refresh.mjs";
import { runTools } from "../../toolkit/runners/run-tools.ts";
const base = resolve(".tmp/portability-tests");
await mkdir(base, { recursive: true });
const root = await mkdtemp(resolve(base, "refresh-button-"));
const world = { path: root, toolkits: [] };
try {
  const branches = [{ id: 123, status: "complete", date_start: 1, date_end: 2, response: { paths: [] } }];
  const execute = async args => {
    assert.equal(args.id, refreshRunnerId);
    assert.deepEqual(JSON.parse(args.content), { path: root, type: "world" });
    return branches;
  };
  const missing = await refreshWorld(world, { execute });
  assert.equal(missing.status, "complete");
  assert.equal(missing.database.saved, false);
  assert.deepEqual(missing.errors, ["DB not found"]);
  assert.deepEqual(missing.branches, branches);
  await writeFile(resolve(root, "rab.project.json"), JSON.stringify({ paths: [{ name: "database", path: ".", file: "fixture.sqlite" }] }));
  const db = new DatabaseSync(resolve(root, "fixture.sqlite"));
  db.exec("CREATE TABLE runs(id INTEGER PRIMARY KEY, name TEXT, title TEXT, type TEXT, description TEXT, path TEXT)");
  const success = await refreshWorld(world, { execute });
  assert.equal(success.database.saved, true);
  assert.equal(success.status, "complete");
  const stored = JSON.parse(db.prepare("SELECT description FROM runs WHERE id=?").get(success.id).description);
  assert.deepEqual(stored.branches, branches);
  assert.equal(stored.database.saved, true);
  const partial = await refreshWorld(world, { execute: async () => [{ status: "complete", error: "Tracking unavailable" }] });
  assert.equal(partial.status, "complete");
  assert.ok(partial.errors.includes("Tracking unavailable"));
  const failed = await refreshWorld(world, { execute: async () => [{ status: "error", error: "Beacon failed" }, ...branches] });
  assert.equal(failed.status, "error");
  assert.equal(failed.branches.length, 2);
  assert.equal(failed.database.saved, true);
  const thrown = await refreshWorld(world, { execute: async () => { throw Error("Runner unavailable"); } });
  assert.equal(thrown.status, "error");
  assert.ok(thrown.errors.includes("Runner unavailable"));
  const recorded = [], updates = [], completed = [];
  const tracked = await run(world, {
    record: step => recorded.push(step),
    update: steps => updates.push(steps),
    complete: steps => completed.push(steps),
  }, {
    execute: (_args, callbacks) => runTools(
      [{ id: 123, type: "tool", name: "fixture-branch", settings: {} }],
      async step => ({ return_type: "results", status: "complete", settings: step.settings }),
      callbacks,
    ),
    save: async () => { throw Error("DB not found"); },
  });
  assert.deepEqual(recorded.map(step => step.name), ["fixture-branch", "save-refresh-report"]);
  assert.equal(completed.length, 1);
  assert.deepEqual(completed[0], tracked);
  assert.deepEqual(updates.at(-1), tracked);
  assert.equal(tracked.at(-1).status, "complete");
  assert.equal(tracked.at(-1).error, "DB not found");
  assert.ok(tracked.every(step => Number.isFinite(step.date_start) && Number.isFinite(step.date_end)));
  const response = () => ({
    headers: {}, setHeader(k, v) { this.headers[k] = v; },
    writeHead(code) { this.code = code; }, end(body) { this.body = JSON.parse(body); },
  });
  let release;
  const handler = createWorldRefreshHandler(world, async args => {
    assert.equal(args.id, refreshSystemRunnerId);
    assert.deepEqual(JSON.parse(args.content), world);
    await new Promise(resolve => { release = resolve; });
    return tracked;
  });
  const get = response();
  await handler({ method: "GET" }, get);
  assert.equal(get.code, 405);
  const post = response();
  const pending = handler({ method: "POST" }, post);
  const conflict = response();
  await handler({ method: "POST" }, conflict);
  assert.equal(conflict.code, 409);
  release();
  await pending;
  assert.equal(post.code, 200);
  assert.equal(post.body.response.database.saved, false);
  assert.deepEqual(post.body.results, tracked);
  const broken = createWorldRefreshHandler(world, async () => { throw Error("Dispatch failed"); });
  for (let i = 0; i < 2; i++) {
    const res = response();
    await broken({ method: "POST" }, res);
    assert.equal(res.code, 500);
    assert.equal(res.body.error, "Dispatch failed");
  }
  db.close();
  console.log("PASS: tracked branches/save, callbacks once, optional DB, API ID dispatch, method/concurrency/error handling.");
} finally {
  const child = relative(base, root);
  if (!child || child.startsWith("..") || isAbsolute(child)) throw Error("Unsafe fixture cleanup");
  await rm(root, { recursive: true, force: true });
}
