import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { run } from "./generate-react-tests.ts";
import { evaluationTestV1, evaluationRunV1 } from "../schema-versions.ts";

const parent = await mkdtemp(join(tmpdir(), "react-evaluation-"));
const originalFetch = globalThis.fetch;
const usage = [];
globalThis.fetch = async (url, settings) => {
  assert.equal(new URL(url).pathname, "/api/tool-usage");
  usage.push(JSON.parse(settings.body));
  return new Response(JSON.stringify({ status: "complete" }));
};
try {
  const settings = { name: "factory-layout-v1", save_path: parent };
  const result = await run(settings);
  assert.equal(result.status, "complete", result.error);
  const bytes = await readFile(join(parent, settings.name, "test.json"));
  const test = evaluationTestV1.parse(JSON.parse(bytes));
  assert.equal(test.name, settings.name);
  assert.equal(result.response.test_sha256, createHash("sha256").update(bytes).digest("hex"));
  assert.equal(result.response.code, bytes.toString());
  assert.deepEqual((await readdir(join(parent, settings.name))).sort(), ["README.md", "runs", "test.json"]);
  assert.ok((await readFile(join(parent, settings.name, "README.md"), "utf8")).includes("MCP"));
  assert.equal((await run(settings)).status, "error", "Existing test must not be overwritten.");
  assert.deepEqual(await readFile(join(parent, settings.name, "test.json")), bytes);
  assert.equal((await run({ name: "bad-version", save_path: parent, schema_version: 2 })).status, "error");
  assert.equal((await run({ name: "missing-path" })).status, "error");
  assert.equal((await run({ name: "../escape", save_path: parent })).status, "error");
  assert.equal((await run({ name: "invalid-check", save_path: parent, checks: [{name:"bad",validator:"tool-succeeded",settings:{id:1}}] })).status, "error");
  assert.equal(evaluationTestV1.safeParse({...test, schema_version:2}).success, false);
  const receipt = { id: 20, name: "trial", type: "evaluation-run", schema_version: 1,
    test_id: test.id, test_version: 1, test_sha256: result.response.test_sha256,
    model: {name:"local",provider:"ollama",digest:"model-digest",settings:{temperature:0}},
    environment: {toolkit_revision:"revision",catalog_sha256:"a".repeat(64)}, thread_id:30,
    date_start:0,date_end:1,status:"complete",outcome:"passed",checks:[],
    metrics:{duration_ms:1,tool_calls:0,tool_errors:0,human_interventions:0,input_tokens:null,output_tokens:null},artifacts:{},run_ids:[] };
  assert.equal(evaluationRunV1.safeParse(receipt).success,true);
  assert.equal(evaluationRunV1.safeParse({...receipt,date_end:-1}).success,false);
  assert.equal(usage.length,6);
  assert.ok(usage.every(item=>item.id===1794613648645));
  console.log(`Passed schema, scaffold, immutability, error and recorder checks. Output: ${parent}`);
} finally { globalThis.fetch = originalFetch; }
