import { test } from "node:test";
import assert from "node:assert/strict";
import {
  synchronizeDesign,
  instantiateClass,
  renameClass,
  resolveElement,
} from "./htmlModel.ts";
import { newDocument, newElement, updateNodes } from "./document.ts";
import { siteCode } from "./site.ts";
import { validateDocument } from "./validation.mjs";
import { copyObject, pasteObject } from "./clipboard.ts";
const make = () => {
  const d = {
    ...newDocument("dev"),
    children: [
      {
        ...newElement("box", 345, 678, 320, 200),
        content: "Hello <world>",
        layout: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        appearance: {
          hover: { "box-shadow": "0 1px 3px #000, 0 4px 8px #0008" },
        },
      },
    ],
  };
  return synchronizeDesign(d, d);
};
test("shared class changes propagate while text and canvas positions stay local", () => {
  let d = make(),
    n = d.children[0];
  d = synchronizeDesign(d, {
    ...d,
    children: [n, instantiateClass(d, n.className)],
  });
  const before = d;
  d = synchronizeDesign(d, {
    ...d,
    children: updateNodes(d.children, n.id, {
      borderRadius: 24,
      content: "Only me",
      x: 999,
    }),
  });
  assert.equal(d.children[1].borderRadius, 24);
  assert.equal(d.children[1].content, "Hello <world>");
  assert.notEqual(d.children[1].x, 999);
  d = synchronizeDesign(d, {
    ...d,
    children: updateNodes(d.children, d.children[1].id, { borderRadius: 0 }),
  });
  assert.equal(d.children[0].borderRadius, 0);
  assert.equal(before.children[0].borderRadius, undefined);
  d = renameClass(d, n.id, "card");
  assert.deepEqual(
    d.children.map((n) => n.className),
    ["card", "card"],
  );
  assert.ok(d.classes.card);
  assert.equal(d.classes["box-1"], undefined);
  assert.deepEqual(
    validateDocument(JSON.parse(JSON.stringify(d))),
    JSON.parse(JSON.stringify(d)),
  );
});
test("HTML export is recursive real flow with no editor coordinates or wrappers", () => {
  let d = make();
  d.children[0].children = [{ ...newElement("box", 77, 88), content: "Child" }];
  d = synchronizeDesign(d, d);
  const code = siteCode(d);
  assert.match(code.html, /<div class="box-1">Hello &lt;world&gt;/);
  assert.match(code.html, /<div class="box-2">Child<\/div>/);
  assert.doesNotMatch(
    code.page,
    /data-editor|data-node|position:\s*absolute|left:\s*345|top:\s*678/,
  );
  assert.match(code.css, /display: flex/);
  assert.match(code.css, /align-items: center/);
  assert.match(code.css, /\.box-1:hover/);
  assert.match(code.component, /export function Composition/);
  assert.match(code.component, /Hello <world>/);
  assert.doesNotMatch(code.component, /data-editor/);
});
test("composition mode is fixed and shared class links survive normal editing", () => {
  const d = make();
  for (const mode of ["html", "canvas"])
    assert.throws(
      () => synchronizeDesign(d, { ...d, mode }),
      /cannot be changed/,
    );
  const next = synchronizeDesign(d, {
    ...d,
    children: [...d.children, instantiateClass(d, d.children[0].className)],
  });
  assert.equal(next.children[0].className, next.children[1].className);
});
test("cross-document clipboard preserves conflicting class definitions without overwriting", () => {
  const source = make(),
    target = make();
  source.classes["box-1"].styles.borderRadius = 30;
  source.children[0].borderRadius = 30;
  const result = pasteObject(
    target,
    copyObject(source, source.children[0].id, "copy"),
  );
  const d = synchronizeDesign(target, result.data);
  assert.notEqual(d.children[1].className, d.children[0].className);
  assert.equal(d.children[1].borderRadius, 30);
  assert.equal(d.children[0].borderRadius, undefined);
  assert.equal(validateDocument(d), d);
});
test("rejects unsafe CSS identifiers and malformed class styles", () => {
  for (const className of [
    "constructor",
    "__proto__",
    "bad class",
    "<script>",
  ]) {
    const d = make();
    d.children[0].className = className;
    assert.throws(() => validateDocument(d));
  }
  const d = make();
  d.classes["box-1"].styles.x = 1;
  assert.throws(() => validateDocument(d));
});

test("resetting a state override retains the underlying exported base style", () => {
  const d = make();
  d.children[0].borderRadius = 24;
  d.children[0].appearance.normal = { "border-radius": undefined };
  d.classes["box-1"].styles.borderRadius = 24;
  d.classes["box-1"].styles.appearance = d.children[0].appearance;
  assert.match(siteCode(d).css, /border-radius: 24px/);
});

test("HTML formatting introduces no whitespace nodes into pre-wrapped block layout", () => {
  const d = {
    ...newDocument("html"),
    children: [
      {
        ...newElement("box", 0, 0),
        children: [newElement("box", 0, 0), newElement("box", 0, 0)],
      },
    ],
  };
  const html = siteCode(d).html;
  assert.doesNotMatch(html, />\s+</);
  assert.doesNotMatch(html, /\n/);
});

test("clipboard supports cleared state overrides and CSS dimension expressions", () => {
  const d = make();
  d.children[0].appearance.normal = { "border-radius": undefined };
  d.children[0].layout.width = "calc(100% - 2rem)";
  d.classes["box-1"].styles.appearance = d.children[0].appearance;
  const copied = copyObject(d, d.children[0].id, "copy");
  assert.ok(copied);
  assert.ok(pasteObject(d, copied));
});

test("class names must be kebab-case, including while typing separators", () => {
  const d = make();
  for (const name of ["card-", "card--large", "card_", "Card", "two words"])
    assert.throws(() => renameClass(d, d.children[0].id, name), /kebab-case/);
  const next = renameClass(d, d.children[0].id, "info-card-2");
  assert.match(
    siteCode(next, next.children[0]).component,
    /function InfoCard2/,
  );
});
test("Dev component widths are absent from CSS; grids retain explicit sizing", () => {
  const d = make();
  d.children[0].layout.width = "320px";
  d.classes["box-1"].styles.layout = d.children[0].layout;
  assert.doesNotMatch(siteCode(d).css, /(?:^|[;\n])\s*(?:min-|max-)?width:/);
  const grid = synchronizeDesign(d, {
    ...d,
    children: updateNodes(d.children, d.children[0].id, {
      layout: { display: "grid", width: "80ch" },
    }),
  });
  assert.match(siteCode(grid).css, /width: 80ch/);
});
test("safe modern CSS lengths and zero render widths persist", () => {
  for (const width of [
    "20ch",
    "100dvw",
    "inherit",
    "0px",
    "calc(100% - 2rem)",
  ]) {
    const d = {
      ...newDocument("html"),
      children: [{ ...newElement("box", 0, 0), layout: { width } }],
    };
    assert.equal(validateDocument(d), d);
  }
  for (const width of ["1px;display:none", "url(secret)", "</style>"]) {
    const d = {
      ...newDocument("html"),
      children: [{ ...newElement("box", 0, 0), layout: { width } }],
    };
    assert.throws(() => validateDocument(d));
  }
});
