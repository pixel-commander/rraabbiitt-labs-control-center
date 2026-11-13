import { test } from "node:test";
import assert from "node:assert/strict";
import { copyObject, pasteObject } from "./clipboard.ts";
import { newDocument, newElement, removeNode } from "./document.ts";
const fixture = () => {
  const child = {
    ...newElement("text", 10, 20, 100, 30),
    content: "Hello",
    appearance: { hover: { color: "#ff00aa" } },
    opacity: 0,
  };
  const parent = {
    ...newElement("box", 50, 60, 300, 200),
    grid: "columns",
    cols: 2,
    children: [child],
  };
  return {
    ...newDocument(),
    children: [parent],
    theme: { "--custom": "#123456" },
  };
};
test("copies recursive structure and styles with fresh independent IDs", () => {
  const data = fixture(),
    before = JSON.stringify(data),
    text = copyObject(data, data.children[0].id, "copy"),
    pasted = pasteObject(data, text);
  assert.equal(JSON.stringify(data), before);
  assert.notEqual(pasted.node.id, data.children[0].id);
  assert.notEqual(pasted.node.children[0].id, data.children[0].children[0].id);
  assert.deepEqual(
    pasted.node.children[0].appearance,
    data.children[0].children[0].appearance,
  );
  assert.equal(pasted.node.children[0].opacity, 0);
  assert.equal(pasted.node.grid, "columns");
  assert.deepEqual([pasted.node.x, pasted.node.y], [70, 80]);
  const again = pasteObject(pasted.data, text);
  assert.deepEqual([again.node.x, again.node.y], [90, 100]);
  assert.notEqual(again.node.id, pasted.node.id);
});
test("pastes a nested node as a sibling and cuts back to original coordinates", () => {
  const data = fixture(),
    child = data.children[0].children[0];
  const text = copyObject(data, child.id, "cut");
  const cut = { ...data, children: removeNode(data.children, child.id) };
  assert.equal(cut.children[0].children.length, 0);
  const result = pasteObject(cut, text);
  assert.equal(result.data.children.length, 1);
  assert.equal(result.data.children[0].children.length, 1);
  assert.deepEqual([result.node.x, result.node.y], [10, 20]);
  assert.notEqual(result.node.id, child.id);
});
test("cross-document paste uses canvas coordinates and adds missing theme tokens", () => {
  const source = fixture(),
    target = {
      ...newDocument(),
      theme: { "--custom": "#ffffff", "--existing": "#000000" },
    };
  const text = copyObject(source, source.children[0].children[0].id, "copy");
  const result = pasteObject(target, text);
  assert.deepEqual([result.node.x, result.node.y], [80, 100]);
  assert.equal(result.data.theme["--custom"], "#ffffff");
  assert.equal(result.data.theme["--existing"], "#000000");
});
test("ignores ordinary text and rejects invalid designer data before insertion", () => {
  const data = fixture();
  assert.equal(pasteObject(data, "ordinary text"), undefined);
  assert.equal(pasteObject(data, "null"), undefined);
  const item = JSON.parse(copyObject(data, data.children[0].id, "copy"));
  item.document.children[0].width = -1;
  assert.throws(() => pasteObject(data, JSON.stringify(item)));
  assert.equal(data.children.length, 1);
});
