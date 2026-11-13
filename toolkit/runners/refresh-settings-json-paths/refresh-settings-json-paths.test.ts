import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "./refresh-settings-json-paths.ts";

test("collects settings tool returns for root and nested locations, continuing after errors", async () => {
  const path = await mkdtemp(join(tmpdir(), "settings-paths-runner-"));
  try {
    await mkdir(join(path, "a-broken"));
    await mkdir(join(path, "z-valid", "deep"), { recursive: true });
    await writeFile(join(path, "rab.settings.json"), JSON.stringify({ id: 123, name: "root" }));
    await writeFile(join(path, "a-broken", "rab.settings.json"), "invalid");
    await writeFile(join(path, "z-valid", "rab.settings.json"), JSON.stringify({ name: "nested" }));
    await writeFile(join(path, "z-valid", "deep", "Example.tsx"), "test");
    let completions = 0;
    const result = await run({ path, refresh: false }, { complete: () => { completions++; } });
    assert.equal(completions, 1);
    assert.equal(result.length, 3);
    assert.deepEqual(result.map(step => step.status), ["error", "complete", "complete"]);
    assert.ok(result.every(step => Number.isSafeInteger(step.run_id) && typeof step.date_end === "number"));
    const nested = result.find(step => step.response?.name === "nested")!;
    assert.equal(nested.settings.refresh, false);
    assert.ok(Number.isSafeInteger(nested.response?.id));
    assert.deepEqual(nested.response?.paths?.find(entry => entry.name === "Example.tsx"), {
      name: "Example.tsx", type: "tsx", path: "deep",
    });
    const saved = JSON.parse(await readFile(join(path, "z-valid", "rab.settings.json"), "utf8"));
    assert.equal(saved.id, nested.response?.id);
    assert.deepEqual(saved.paths, nested.response?.paths);
    assert.equal(result.find(step => step.response?.name === "root")?.response?.id, 123);
  } finally { await rm(path, { recursive: true, force: true }); }
});

test("returns an empty array for no matches and rejects invalid input", async () => {
  const path = await mkdtemp(join(tmpdir(), "no-settings-paths-"));
  try {
    assert.deepEqual(await run({ path }), []);
    await assert.rejects(run({}), /Supply path/);
    await writeFile(join(path, "file.txt"), "test");
    await assert.rejects(run({ path: join(path, "file.txt") }), /must be a folder/);
  } finally { await rm(path, { recursive: true, force: true }); }
});
