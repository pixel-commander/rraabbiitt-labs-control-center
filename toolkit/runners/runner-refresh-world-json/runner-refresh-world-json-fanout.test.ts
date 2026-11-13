import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { run } from "./runner-refresh-world-json.ts";
import { runnerWorldTooling as runnerToolingAndTracking } from "../runner-world-tooling/runner-world-tooling.ts";

test(
  "parallel children overlap and next step waits for both",
  { timeout: 2000 },
  async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const started: string[] = [];
    const results = await runnerToolingAndTracking(
      {
        runs: [
          {
            type: "runner",
            name: "fanout",
            settings: {
              parallel: true,
              runs: [
                { type: "tool", name: "a", settings: {} },
                { type: "tool", name: "b", settings: {} },
              ],
            },
          },
          { type: "tool", name: "after", settings: {} },
        ],
      },
      {
        execute: async (step) => {
          started.push(step.name!);
          if (step.name === "a") await gate;
          if (step.name === "b") release();
          if (step.name === "after")
            assert.deepEqual(started, ["a", "b", "after"]);
          return { status: "complete", settings: step.settings };
        },
      },
    );
    assert.ok(results.every((x) => x.status === "complete"));
    assert.ok(results[3].date_start! >= results[1].date_end!);
    assert.ok(results[3].date_start! >= results[2].date_end!);
  },
);

test("world refresh barriers, nested project order, preservation and self-filename cleanup", async () => {
  const root = await mkdtemp(join(tmpdir(), "refresh-world-"));
  const read = async (path: string) => JSON.parse(await readFile(path, "utf8"));
  const put = async (path: string, value: unknown) => {
    await mkdir(join(root, path), { recursive: true });
    await writeFile(
      join(root, path, "rab.project.json"),
      JSON.stringify(value),
    );
  };
  try {
    await put("p", {
      id: 1,
      file: "rab.project.json",
      paths: [{ type: "path", name: "custom", path: "custom" }],
    });
    await put("p/nested", { id: 2 });
    await put("q", { id: 3 });
    for (const path of ["p/a", "p/nested/b", "q/a"]) {
      await mkdir(join(root, path, "item"), { recursive: true });
      await writeFile(
        join(root, path, "rab.beacon.json"),
        JSON.stringify({
          name: path,
          type: "toolkit",
          file: "rab.beacon.json",
        }),
      );
      await writeFile(
        join(root, path, "item/rab.settings.json"),
        JSON.stringify({
          id: 10,
          name: "item",
          file: path === "q/a" ? "item.ts" : "rab.settings.json",
        }),
      );
    }
    await mkdir(join(root, "node_modules/ignored"), { recursive: true });
    await writeFile(
      join(root, "node_modules/ignored/rab.beacon.json"),
      "invalid",
    );
    const results = await run({ path: root, type: "world" });
    assert.ok(
      results.every((x) => x.status === "complete"),
      JSON.stringify(results),
    );
    const beacons = results.filter((x) => x.name === "refresh-beacon-json");
    const projects = results.filter((x) => x.name === "refresh-project-json");
    assert.equal(beacons.length, 3);
    assert.equal(projects.length, 3);
    assert.equal(projects[0].settings.path, join(root, "p/nested"));
    assert.ok(
      projects.every((p) => beacons.every((b) => p.date_start! >= b.date_end!)),
    );
    for (const b of beacons) {
      const record = await read(
        join(String(b.settings.path), "rab.beacon.json"),
      );
      assert.equal(record.file, undefined);
      assert.equal(
        record.paths[0].file,
        String(b.settings.path).endsWith(join("q", "a"))
          ? "item.ts"
          : undefined,
      );
      assert.equal(record.type, "toolkit");
    }
    const parent = await read(join(root, "p/rab.project.json"));
    assert.equal(parent.file, undefined);
    assert.equal(parent.path, join(root, "p").replaceAll("\\", "/"));
    assert.ok(parent.paths.some((x: any) => x.name === "custom"));
    const before = await readFile(join(root, "p/rab.project.json"), "utf8");
    await writeFile(join(root, "p/a/item/rab.settings.json"), "invalid");
    const bad = await run({ path: root, type: "world" });
    assert.equal(
      bad.find(
        (x) =>
          x.name === "refresh-project-json" &&
          x.settings.path === join(root, "p"),
      )?.status,
      "error",
    );
    assert.equal(
      bad.find(
        (x) =>
          x.name === "refresh-project-json" &&
          x.settings.path === join(root, "q"),
      )?.status,
      "complete",
    );
    assert.equal(
      await readFile(join(root, "p/rab.project.json"), "utf8"),
      before,
    );
  } finally {
    const tempRoot = resolve(tmpdir());
    const target = resolve(root);
    assert.ok(target.startsWith(tempRoot + sep));
    await rm(target, { recursive: true, force: true });
  }
});
