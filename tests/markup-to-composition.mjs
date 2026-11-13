import assert from "node:assert/strict";
import { createServer } from "vite";
import { generateCompositionFromMarkup } from "../src/dashboards/Factory/components/ComponentFactory/js/generateCompositionFromMarkup/generateCompositionFromMarkup.mjs";

const result = generateCompositionFromMarkup(`
export const Demo = () => {
  return <article className="container-main card" data-grid="header-main" style={{ borderRadius: 12 }}>
    <header data-area="header"><h2>Hello</h2><img src="ignored.png" /></header>
    <ul data-area="main">{items.map(item => <li className="row"><strong>{item.name}</strong><span>Static text</span></li>)}</ul>
  </article>;
};`);
assert.equal(result.return_type, "results");
assert.equal(result.status, "complete");
const document = result.response;
const warnings = document.warnings;
assert.equal(document.root.name, "card");
assert.equal(document.root.container_class, "container-main");
assert.equal(document.root.css.borderRadius, 12);
assert.equal(document.root.children[0].children.length, 1);
assert.equal(document.root.children[1].children.length, 1);
assert.equal(document.root.children[1].children[0].tag, "li");
assert.ok(warnings.some(message => message.includes("loop")));
assert.ok(warnings.some(message => message.includes("item.name")));
const mixed = generateCompositionFromMarkup('<p>Hello <strong>world</strong> again<img src="x"><span>!</span></p>').response;
assert.deepEqual(mixed.root.children.map(child => child.text), ["Hello ", "world", " again", "!"]);
const html = generateCompositionFromMarkup('<div class="container-main box" style="color: red; margin-top: 12px"><p>A</p><p>B</p></div>').response;
assert.equal(html.root.css.marginTop, "12px");
assert.notEqual(html.root.children[0].name, html.root.children[1].name);
const server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true }, appType: "custom" });
try {
  const { readComposition } = await server.ssrLoadModule('/src/dashboards/Factory/components/ComponentFactory/js/compositionTree.ts');
  for (const input of [document, mixed, html]) readComposition(input);
} finally { await server.close(); }
const failed = generateCompositionFromMarkup('const value = 1');
assert.equal(failed.status, 'error');
assert.match(failed.error, /No static JSX/);
assert.equal(failed.settings.source, 'const value = 1');
console.log('Markup import: JSX/demo loops, images, mixed text order, HTML styles, unique names, and Factory validation passed.');


