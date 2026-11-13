import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
const exec = promisify(execFile);
const base = resolve(".tmp/portability-tests");
await mkdir(base, { recursive: true });
const root = await mkdtemp(resolve(base, "tool-routing-"));
try {
  const cli = pathToFileURL(resolve("toolkit/rab-world/runners/tool-cli.mjs")).href;
  await writeFile(resolve(root, "rab.settings.json"), JSON.stringify({ id: 123, name: "fixture-tool", type: "tool" }));
  await writeFile(resolve(root, "fixture.mjs"), `
    import { runToolCli } from ${JSON.stringify(cli)};
    await runToolCli(import.meta.url, async settings => {
      if (settings.fail) throw Error("fixture failure");
      return { return_type: "results", status: "complete", settings, response: { calls: 1 } };
    });
  `);
  const { stdout } = await exec(process.execPath, [resolve(root, "fixture.mjs"), '{"value":7}']);
  const result = JSON.parse(stdout);
  assert.equal(result.id, 123);
  assert.equal(result.status, "complete");
  assert.equal(result.response.calls, 1);
  assert.equal(result.settings.value, 7);
  assert.ok(Number.isFinite(result.date_start) && Number.isFinite(result.date_end));
  try {
    await exec(process.execPath, [resolve(root, "fixture.mjs"), '{"fail":true}']);
    assert.fail("Expected failure exit code");
  } catch (error) {
    assert.equal(error.code, 1);
    const failed = JSON.parse(error.stdout);
    assert.equal(failed.status, "error");
    assert.equal(failed.error, "fixture failure");
    assert.equal(failed.id, 123);
    assert.ok(Number.isFinite(failed.date_end));
  }
  const search = await readFile("api/search-records/search-records.mjs", "utf8");
  assert.ok(search.includes("await useTool({"));
  assert.ok(!search.includes("executeToolById"));
  console.log("PASS: direct CLI goes through existing runner once; IDs, timing, thrown errors and exit status preserved; search uses dispatcher.");
} finally {
  const child = relative(base, root);
  if (!child || child.startsWith("..") || isAbsolute(child)) throw Error("Unsafe fixture cleanup");
  await rm(root, { recursive: true, force: true });
}
