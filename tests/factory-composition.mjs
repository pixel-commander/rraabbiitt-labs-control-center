import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
import ts from "typescript";
import { resolve } from "node:path";
import { saveComponent } from "../src/dashboards/Factory/api/save-component.mjs";

const server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true }, appType: "custom" });
try {
  const base = "/src/dashboards/Factory/components/ComponentFactory";
  const { readComposition, treeToComposition, compositionToTree } = await server.ssrLoadModule(`${base}/js/compositionTree.ts`);
  const { compositionCode } = await server.ssrLoadModule(`${base}/js/compositionCode.ts`);
  const design = JSON.parse(await readFile(new URL(`../src/dashboards/Factory/components/ComponentFactory/demo/design.json`, import.meta.url), "utf8"));
  const document = readComposition(JSON.stringify(design));
  const nodes = node => [node, ...(node.children ?? []).flatMap(nodes)];
  const ids = nodes(document.root).map(node => node.id);
  const flat = treeToComposition(document);
  assert.equal(flat.elements.length, 6);
  const restored = compositionToTree(flat, document);
  assert.deepEqual(nodes(restored.root).map(node => node.id), ids);
  assert.equal(restored.root.name, "project-card");
  assert.equal(nodes(restored.root).find(node => node.id === 1005).tag, "p");
  for (const node of nodes(restored.root)) {
    for (const key of ["kind", "area", "atom_class", "layout", "style"]) assert.ok(!(key in node), `Public JSON must not contain ${key}`);
  }
  assert.equal(restored.root.grid_type, "header-main");
  assert.equal(restored.root.padding, 24);
  assert.equal(nodes(restored.root).find(node => node.id === 1007).action_class, "action-main");
  assert.deepEqual(nodes(restored.root).find(node => node.id === 1006).css, { display: "flex", alignItems: "center" });
  const edited = compositionToTree({ ...flat, elements: flat.elements.map(node => node.id === 1007 ? { ...node, text: "Ship it" } : node) }, document);
  assert.equal(nodes(edited.root).find(node => node.id === 1007).text, "Ship it");
  assert.deepEqual(nodes(edited.root).map(node => node.id), ids);
  const { html, css } = compositionCode(document);
  assert.match(html, /^<article/);
  const formatted = compositionCode(document, "html", true).html;
  assert.match(formatted, /^<article[^>]*>\n  <header/);
  assert.match(formatted, /\n        <button/);
  assert.match(formatted, /<h2[^>]*>Build from JSON<\/h2>/);
  assert.match(html, /<footer[^>]*><button[^>]*>Build something<\/button><a[^>]*href="\/style-guide#stylers"/);
  assert.match(html, /<p[^>]*>One composition/);
  assert.match(css, /line-height: 1.6;/);
  assert.doesNotMatch(css, /line-height: 1.6px/);
  assert.match(css, /padding: 24px;/);
  assert.match(css, /\.project-card \{/);
  assert.match(css, /\.title \{/);
  assert.match(html, /class="action-main build-button"/);
  assert.doesNotMatch(html, /projectcard-item/);
  const fieldDesign = readComposition({ tag: "div", name: "fields", id: 50, grid_rows: 2, grid_cols: 3, scroll_x: true, scroll_y: false, padding: "md", gap: 12, css: { backgroundColor: "red" }, children: [] });
  const fieldRoundtrip = compositionToTree(treeToComposition(fieldDesign), fieldDesign);
  assert.equal(fieldRoundtrip.root.grid_rows, 2);
  assert.equal(fieldRoundtrip.root.grid_cols, 3);
  assert.equal(fieldRoundtrip.root.scroll_x, true);
  assert.equal(fieldRoundtrip.root.scroll_y, false);
  assert.equal(fieldRoundtrip.root.padding, "md");
  assert.equal(fieldRoundtrip.root.gap, 12);
  const fieldCode = compositionCode(fieldDesign);
  assert.match(fieldCode.html, /data-rows="2" data-cols="3"/);
  assert.match(fieldCode.css, /overflow-x: auto/);
  assert.match(fieldCode.css, /padding: var\(--space-md\)/);
  assert.match(fieldCode.css, /gap: 12px/);
  assert.match(fieldCode.css, /\.fields \{[\s\S]*background-color: red/);
  const directGrid = readComposition({ tag: "div", name: "direct-grid", id: 60, grid_cols: 2, children: [
    { tag: "div", name: "first", id: 61, css: { backgroundColor: "red" } },
    { tag: "div", name: "second", id: 62, css: { backgroundColor: "blue" } },
  ] });
  const directRoundtrip = compositionToTree(treeToComposition(directGrid), directGrid);
  assert.deepEqual(directRoundtrip.root.children.map(node => node.id), [61, 62], "Editing preserves explicit grid children without inserting slots");
  const differentlyNamedArea = readComposition({ tag: "div", name: "area-test", id: 70, grid_type: "header-main", children: [
    { tag: "main", name: "card-content", id: 71, grid_area: "main" },
  ] });
  assert.match(compositionCode(differentlyNamedArea).html, /data-area="main" class="card-content"/);
  assert.match(compositionCode(differentlyNamedArea).css, /grid-area: main/);
  const cssGrid = readComposition({ tag: "div", name: "css-grid", id: 80, css: { display: "grid", gridTemplateAreas: '"content"' }, children: [{ tag: "section", name: "css-content", id: 81, grid_area: "content", children: [] }] });
  const cssGridProjection = treeToComposition(cssGrid);
  cssGridProjection.elements.push({ id: 82, nodeName: "added-text", type: "Text", area: "shell/content", text: "Added", color: "red", size: 16, heading: "h2", container: "", effect: "", action: "" });
  const added = compositionToTree(cssGridProjection, cssGrid);
  assert.equal(added.root.children[0].id, 81);
  assert.equal(added.root.children[0].children[0].text, "Added");
  const paintDesign = compositionToTree({ grid: "single-cell", frame: { x: 24, y: 24, width: 480, height: 280 }, elements: [], gridStyle: {
    paint: { gradient: true, angle: 120, background: "rgb(1, 2, 3)", gradientEnd: "#fff", radiusAll: false, radiusCorners: { "top-left": 12 }, borders: { all: { width: 0, style: "solid", color: "red" } }, shadows: [{ inset: true, x: 0, y: 2, blur: 8, spread: 0, color: "rgba(0, 0, 0, 0.3)" }] }
  } });
  const paintControls = treeToComposition(paintDesign).gridStyle.paint;
  assert.equal(paintControls.gradient, true);
  assert.equal(paintControls.angle, 120);
  assert.equal(paintControls.background, "rgb(1, 2, 3)");
  assert.equal(paintControls.radiusCorners["top-left"], 12);
  assert.equal(paintControls.borders.all.width, 0);
  assert.equal(paintControls.shadows[0].color, "rgba(0, 0, 0, 0.3)");
  const jsx = compositionCode(edited, "jsx").code;
  const source = ts.createSourceFile("test.tsx", `const Demo = () => (${jsx});`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  assert.equal(source.parseDiagnostics.length, 0);
  assert.match(jsx, /\{"Ship it"\}/);
  const legacy = readComposition({ grid: "holy-grail", frame: { x: 24, y: 24, width: 480, height: 280 }, elements: [] });
  assert.equal(legacy.root.children.length, 5);
  assert.ok(legacy.root.children.every(node => node.grid_area));
  const plain = readComposition({ version: 2, root: { id: 10, name: "card", tag: "div", children: [{ id: 11, name: "body", tag: "p", text: "Body", children: [] }] } });
  assert.equal(compositionToTree(treeToComposition(plain), plain).root.children[0].id, 11);
  assert.equal(compositionCode(plain).html.match(/<div/g).length, 1, "No phantom grid wrappers in tree export");
  assert.throws(() => readComposition("{"));
  assert.throws(() => readComposition({ tag: "div", name: "typo", conainer_class: "container-main" }), /Unknown node field/);
  assert.throws(() => readComposition({ tag: "div", name: "bad-grid", grid_rows: 0 }), /Grid rows/);
  assert.throws(() => readComposition({ version: 2, root: { id: 1, name: "bad", tag: "script" } }));
  assert.throws(() => readComposition({ version: 2, root: { id: 1, name: "bad", tag: "div", children: [{ id: 1, name: "duplicate", tag: "div" }] } }));
  if (process.argv.includes("--save")) {
    const payload = {
      name: "FactoryTreeCheck", title: "Factory tree integration check", description: "Temporary nested composition save test.",
      type: "component", path: `src/.tmp/factory-tree-${Date.now()}`, composition: document,
      ...compositionCode(document, "jsx"),
    };
    const saved = await saveComponent(payload, resolve("toolkit"), resolve("."));
    const stored = JSON.parse(await readFile(saved.file, "utf8"));
    assert.equal(stored.version, 2);
    assert.deepEqual(nodes(stored.root).map(node => node.id), ids);
    const generated = await readFile(resolve(saved.path, saved.name, `${saved.name}.tsx`), "utf8");
    assert.match(generated, /<article/);
    assert.match(generated, /Build something/);
    const stylesheet = generated.match(/import ["'](.+\.css)["']/)[1];
    assert.match(await readFile(resolve(saved.path, saved.name, stylesheet), "utf8"), /\.title \{/);
    const confirmation = await saveComponent({ ...payload, id: saved.id }, resolve("toolkit"), resolve("."));
    assert.equal(confirmation.requires_confirmation, true);
    const updated = await saveComponent({ ...payload, id: saved.id, overwrite: true, composition: edited, ...compositionCode(edited, "jsx") }, resolve("toolkit"), resolve("."));
    assert.equal(updated.id, saved.id);
    assert.match(await readFile(resolve(updated.path, updated.name, `${updated.name}.tsx`), "utf8"), /Ship it/);
    console.log("Factory save: scaffold, nested JSON storage, overwrite confirmation, and update passed (temporary component under .tmp).");
  }
  console.log("Factory composition: nested design, stable IDs, edits, legacy migration, HTML/JSX/CSS conversion, and invalid input checks passed.");
} finally {
  await server.close();
}
