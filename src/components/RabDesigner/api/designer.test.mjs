import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { validateDocument, saveDocument } from "./designer.mjs";
import { splitShadows } from "../js/shadows.ts";
import { canvasAppearance } from "../js/canvasAppearance.ts";
import { hsvToHex, rgbToHsv } from "../js/color.ts";
import { parseShadow, shadowValue } from "../js/shadows.ts";
const node = {
  id: 2,
  title: "Card",
  type: "box",
  x: 0,
  y: 0,
  width: 200,
  height: 120,
  content: "",
  surface: "main",
  color: "default",
  fontSize: 16,
  children: [],
};
const make = () => ({
  schema: 1,
  id: 1,
  title: "Test",
  children: [structuredClone(node)],
});
test("nested styles, zero values, states, and theme survive save and overwrite", async () => {
  const data = make();
  data.theme = {
    "--accent-default": "#ff00aa",
    "--new-shadow": "inset 0 1px 2px #fff6, 0 8px 24px #0008",
  };
  Object.assign(data.children[0], {
    opacity: 0,
    borderRadius: 0,
    borderWidth: 0,
    gap: 0,
    padding: 0,
    grid: "columns",
    cols: 3,
    appearance: {
      normal: { "box-shadow": "var(--new-shadow)" },
      hover: { "background-color": "var(--accent-default)" },
      active: { filter: "brightness(.8)" },
    },
  });
  data.children[0].children = [
    {
      ...structuredClone(node),
      id: 3,
      appearance: { normal: { "border-top-left-radius": "0px" } },
    },
  ];
  const root = await mkdtemp(join(tmpdir(), "rab-designer-test-"));
  try {
    await saveDocument(data, root);
    assert.deepEqual(
      JSON.parse(await readFile(join(root, "1.json"), "utf8")),
      data,
    );
    data.title = "Changed";
    await saveDocument(data, root);
    assert.equal(
      JSON.parse(await readFile(join(root, "1.json"), "utf8")).title,
      "Changed",
    );
  } finally {
    assert.ok(
      resolve(root).startsWith(resolve(tmpdir()) + "\\") ||
        resolve(root).startsWith(resolve(tmpdir()) + "/"),
    );
    await rm(root, { recursive: true });
  }
});
test("old compositions remain valid without optional styles", () =>
  assert.equal(validateDocument(make()).children.length, 1));
test("rejects malformed states, CSS, themes, and bounds", () => {
  for (const patch of [
    { opacity: 1.1 },
    { borderRadius: -1 },
    { appearance: { hover: { position: "fixed" } } },
    { appearance: { normal: { "box-shadow": "none;}body{display:none" } } },
  ]) {
    const data = make();
    Object.assign(data.children[0], patch);
    assert.throws(() => validateDocument(data));
  }
  for (const theme of [
    { "bad-key": "red" },
    { "--unsafe": "url(https://example.invalid)" },
    { "--empty": "" },
  ])
    assert.throws(() => validateDocument({ ...make(), theme }));
});
test("shadow layers preserve commas inside color functions", () =>
  assert.deepEqual(
    splitShadows(
      "inset 0 1px 2px rgba(0, 0, 0, .5), 0 8px 12px rgb(2 3 4 / 20%)",
    ),
    ["inset 0 1px 2px rgba(0, 0, 0, .5)", "0 8px 12px rgb(2 3 4 / 20%)"],
  ));
test("state CSS uses real pseudo states and explicit preview states", () => {
  const css = canvasAppearance(2, {
    normal: { "border-top": "2px dashed red" },
    hover: { "box-shadow": "0 2px 4px #000" },
    active: { opacity: "0.5" },
  });
  assert.match(css, /\[data-node="2"\]/);
  assert.match(css, /:hover/);
  assert.match(css, /:active/);
  assert.match(css, /data-preview-state="hover"/);
  assert.match(css, /border-top:2px dashed red/);
});
test("visual picker preserves RGB channels and transparent alpha", () => {
  for (const [r, g, b] of [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [31, 66, 128],
    [0, 0, 0],
    [255, 255, 255],
  ]) {
    const c = rgbToHsv(r, g, b);
    assert.equal(
      hsvToHex(c.h, c.s, c.v),
      "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join(""),
    );
  }
  assert.equal(hsvToHex(0, 1, 1, 0), "#ff000000");
});
test("visual shadow controls preserve inset, negative spread, and color functions", () => {
  const value = "inset -2px 3px 12px -4px rgba(20, 30, 40, .5)";
  assert.equal(shadowValue(parseShadow(value)), value);
});
