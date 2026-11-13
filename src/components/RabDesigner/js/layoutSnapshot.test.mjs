import { test } from "node:test";
import assert from "node:assert/strict";
import { newDocument, newElement } from "./document.ts";
import { snapshotLayout } from "./layoutSnapshot.ts";
import { compositionCode } from "./composition.ts";
import { siteCode } from "./site.ts";
import { validateDocument } from "./validation.mjs";
test("Layout saves actual grid cell geometry and exports absolute children", () => {
  const first = newElement("box", 99, 88),
    second = newElement("box", 99, 88),
    parent = {
      ...newElement("box", 20, 30, 600, 200),
      grid: "columns",
      cols: 2,
      children: [first, second],
    };
  const data = { ...newDocument(), children: [parent] },
    positions = new Map([
      [first.id, { x: 16, y: 16, width: 268.5, height: 168 }],
      [second.id, { x: 315.5, y: 16, width: 268.5, height: 168 }],
    ]);
  const saved = snapshotLayout(data, positions);
  assert.equal(saved.children[0].children[1].x, 315.5);
  assert.equal(saved.children[0].children[0].width, 268.5);
  assert.equal(first.x, 99);
  const reopened = validateDocument(JSON.parse(JSON.stringify(saved)));
  const output = compositionCode(reopened.children);
  assert.match(output.css, /left: 315.5px/);
  assert.equal((output.css.match(/position: absolute/g) || []).length, 3);
  assert.doesNotMatch(output.jsx, /data-cols|data-rows/);
});
test("Dev keeps CSS grid and ignores Layout geometry capture", () => {
  const data = {
    ...newDocument("dev"),
    children: [
      {
        ...newElement("box", 500, 600),
        layout: { display: "grid" },
        children: [newElement("box", 40, 50)],
      },
    ],
  };
  assert.equal(
    snapshotLayout(
      data,
      new Map([[data.children[0].id, { x: 0, y: 0, width: 900, height: 900 }]]),
    ),
    data,
  );
  const output = siteCode(data);
  assert.match(output.css, /display: grid/);
  assert.doesNotMatch(output.css, /position: absolute|left: 500px|top: 600px/);
});

test("unchanged captured geometry preserves identity and does not create save edits", () => {
  const node = newElement("box", 20, 30, 200, 100),
    data = { ...newDocument(), children: [node] };
  const boxes = new Map([[node.id, { x: 20, y: 30, width: 200, height: 100 }]]);
  assert.equal(snapshotLayout(data, boxes), data);
});
