import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { run } from "./runner-refresh-world-json.ts";

for (const initial of [
  { id: 123, paths: [] },
  { id: 123 },
  { id: 123, paths: [{ path: "Z:/old-computer/missing-beacon" }] },
])
  test(`registry ${JSON.stringify(initial)} discovers actual nested beacons in one call`, async () => {
    const path = await mkdtemp(join(tmpdir(), "refresh-empty-project-"));
    const read = async (file: string) =>
      JSON.parse(await readFile(file, "utf8"));
    try {
      await writeFile(join(path, "rab.project.json"), JSON.stringify(initial));
      for (const name of ["a", "nested/b"]) {
        await mkdir(join(path, name, "component"), { recursive: true });
        await writeFile(
          join(path, name, "rab.beacon.json"),
          JSON.stringify({ name, path: name, paths: [] }),
        );
        await writeFile(
          join(path, name, "component", "rab.settings.json"),
          JSON.stringify({ id: name === "a" ? 1 : 2, name: "component" }),
        );
      }
      let completed = 0;
      const results = await run(
        { path, type: "project" },
        {
          complete: () => {
            completed++;
          },
        },
      );
      assert.deepEqual(
        results.filter((step) => step.type === "tool").map((step) => step.name),
        ["refresh-beacon-json", "refresh-beacon-json", "refresh-project-json"],
      );
      assert.ok(
        results.every(
          (step) =>
            step.status === "complete" && Number.isSafeInteger(step.run_id),
        ),
      );
      assert.equal(completed, 1);
      const project = await read(join(path, "rab.project.json"));
      assert.equal(project.id, 123);
      assert.equal(project.paths.length, 2);
      for (const entry of project.paths) {
        const beacon = await read(resolve(path, entry.path, "rab.beacon.json"));
        assert.ok(Number.isSafeInteger(beacon.id));
        assert.equal(entry.id, beacon.id);
        assert.equal(beacon.paths.length, 1);
      }
      const repeat = await run({ path, type: "project" });
      assert.deepEqual(
        repeat.filter((step) => step.type === "tool").map((step) => step.name),
        ["refresh-beacon-json", "refresh-beacon-json", "refresh-project-json"],
      );
      assert.deepEqual(await read(join(path, "rab.project.json")), project);
    } finally {
      await rm(path, { recursive: true, force: true });
    }
  });

test("an empty project with no beacons finishes after discovery", async () => {
  const path = await mkdtemp(join(tmpdir(), "refresh-no-beacons-"));
  try {
    await writeFile(
      join(path, "rab.project.json"),
      JSON.stringify({ paths: [] }),
    );
    const results = await run({ path, type: "project" });
    assert.equal(results.length, 1);
    assert.equal(results[0].status, "complete");
  } finally {
    await rm(path, { recursive: true, force: true });
  }
});
