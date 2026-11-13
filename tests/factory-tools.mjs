import assert from "node:assert/strict";
import { run as generate } from "../src/dashboards/Factory/toolkit/tools/generate-factory-composition/generate-factory-composition.ts";
import { run as find } from "../src/dashboards/Factory/toolkit/tools/find-factory-composition/find-factory-composition.ts";
import { run as save } from "../src/dashboards/Factory/toolkit/tools/save-factory-composition/save-factory-composition.ts";

const originalFetch = globalThis.fetch;
const records = new Map();
const usage = [];
let writes = 0;
globalThis.fetch = async (address, options = {}) => {
  const url = new URL(address);
  const body = options.body ? JSON.parse(options.body) : undefined;
  const reply = (data, status = 200) => new Response(JSON.stringify(data), { status });
  if (url.pathname === "/api/tool-usage") { usage.push(body.id); return reply({ status: "complete" }); }
  assert.match(url.pathname, /^\/api\/factory\/compositions(?:\/\d+)?$/);
  const id = Number(url.pathname.split("/")[4]);
  if (options.method === "POST" || options.method === "PUT") {
    writes++;
    const record = { title: body.name, description: "", tags: [], paths: [], ...body, id: id || 1 };
    records.set(record.id, record);
    return reply(record, options.method === "POST" ? 201 : 200);
  }
  if (id) return records.has(id) ? reply(records.get(id)) : reply({ error: "Composition not found." }, 404);
  return reply({ items: [...records.values()], total: records.size });
};
try {
  const generated = await generate({ content: '<article className="container-main test-card"><h2>Hello</h2></article>', name: "TestCard" });
  assert.equal(generated.status, "complete", generated.error);
  assert.equal(generated.response.root.tag, "article");
  assert.equal(generated.response.root.children[0].text, "Hello");
  assert.equal(generated.response.root.container_class, "container-main");
  const { type, warnings, ...composition } = generated.response;
  const created = await save({ name: "TestCard", description: "Keep this", tags: ["demo"], composition });
  assert.equal(created.status, "complete", created.error);
  assert.equal(created.response.id, 1);
  assert.match(created.response.url, /\/factory#1$/);
  const updated = await save({ id: 1, composition: { ...composition, root: { ...composition.root, text: "Updated" } } });
  assert.equal(updated.status, "complete", updated.error);
  assert.equal(updated.response.description, "Keep this");
  assert.deepEqual(updated.response.tags, ["demo"]);
  const loaded = await find({ id: 1 });
  assert.equal(loaded.response.composition.root.text, "Updated");
  assert.equal((await find({ query: "TestCard" })).response.paths[0].id, 1);
  assert.equal((await find({ query: "no-match" })).response.summary.count, 0);
  const before = writes;
  const invalid = await save({ id: 1, composition: { tag: "div", name: "invalid", grid_cols: 99 } });
  assert.equal(invalid.status, "error");
  assert.match(invalid.error, /Grid rows and cols/);
  assert.equal(writes, before);
  assert.equal((await generate({})).status, "error");
  assert.equal((await find({ id: 999 })).status, "error");
  assert.equal(usage.length, 9, "Every entry point must report usage once.");
  console.log("Factory tool entry points: generation, create/update, find, errors, and usage passed.");
} finally { globalThis.fetch = originalFetch; }
