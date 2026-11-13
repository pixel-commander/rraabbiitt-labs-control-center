import { test } from "node:test";
import assert from "node:assert/strict";
import { newElement } from "./document.ts";
import { resizeElement } from "./resize.ts";
test("horizontal resize starts from rendered CSS size and preserves responsive height", () => {
  const n = {
    ...newElement("box", 20, 30, 160, 100),
    layout: { width: "20rem", height: "50vh" },
  };
  const next = resizeElement(
    n,
    { width: 320, height: 400 },
    "e",
    20,
    0,
    "html",
  );
  assert.equal(next.layout.width, "340px");
  assert.equal(next.layout.height, "50vh");
  assert.equal(next.height, 100);
});
test("west resize anchors the rendered right edge at any zoom-normalized delta", () => {
  const n = newElement("box", 20, 30, 160, 100);
  const next = resizeElement(
    n,
    { width: 320, height: 100 },
    "w",
    20,
    0,
    "html",
  );
  assert.equal(next.x, 40);
  assert.equal(next.width, 300);
  assert.equal(next.x + next.width, 340);
});
test("Dev widths resize editor frames, while grids resize CSS", () => {
  const n = newElement("box", 20, 30, 160, 100),
    frame = resizeElement(n, { width: 160, height: 100 }, "e", 40, 0, "dev");
  assert.equal(frame.width, 200);
  assert.equal(frame.layout.width, undefined);
  const child = resizeElement(
    n,
    { width: 160, height: 100 },
    "e",
    40,
    0,
    "dev",
    false,
  );
  assert.equal(child.width, 160);
  const grid = resizeElement(
    { ...n, layout: { display: "grid" } },
    { width: 160, height: 100 },
    "e",
    40,
    0,
    "dev",
  );
  assert.equal(grid.layout.width, "200px");
});
