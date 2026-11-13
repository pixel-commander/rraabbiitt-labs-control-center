import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { newDocument, newElement } from "./document.ts";
import { setViewGrid, addViewElement, viewGrids } from "./viewGrid.ts";
import { siteCode, htmlStyle } from "./site.ts";
import { validateDocument } from "./validation.mjs";
const css = readFileSync(
  new URL("../../../css/grid.css", import.meta.url),
  "utf8",
);
test("View creates a house shell and survives save JSON validation", () => {
  const doc = newDocument("view");
  assert.equal(doc.children[0]["data-grid"], "shell");
  assert.deepEqual(
    doc.children[0].children.map((n) => n["data-area"]),
    ["header", "main", "footer"],
  );
  assert.deepEqual(validateDocument(JSON.parse(JSON.stringify(doc))), doc);
  for (const name of Object.keys(viewGrids))
    assert.ok(css.includes(`[data-grid="${name}"]`));
});
test("View adds only inside a selected area or div and retains content on grid change", () => {
  let doc = newDocument("view");
  const header = doc.children[0].children[0];
  const child = newElement("box", 999, 888);
  assert.throws(() => addViewElement(doc, undefined, child), /Select/);
  assert.throws(() => addViewElement(doc, doc.children[0].id, child), /Select/);
  doc = addViewElement(doc, header.id, child);
  doc = setViewGrid(doc, "side-left");
  const main = doc.children[0].children.find((n) => n["data-area"] === "main");
  assert.equal(main.children[0].id, child.id);
  assert.equal(main.children[0].x, 0);
  assert.equal(setViewGrid(doc, "side-left"), doc);
});
test("View exports canonical grid attributes and house CSS without editor positions", () => {
  const doc = newDocument("view");
  const output = siteCode(doc, undefined, css);
  assert.match(output.html, /data-grid="shell"/);
  assert.match(output.html, /data-area="main"/);
  assert.ok(output.css.includes(css));
  assert.match(output.css, /height: 100vh/);
  assert.doesNotMatch(output.html, /editor-frame/);
  assert.doesNotMatch(output.css, /position: absolute/);
  assert.equal(htmlStyle(doc.children[0], "view").display, undefined);
});
