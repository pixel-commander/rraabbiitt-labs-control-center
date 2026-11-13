import ts from "typescript";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const tags = new Set("article aside div footer header main nav section span h1 h2 h3 h4 h5 h6 button a p strong em small ul ol li".split(" "));
const skip = new Set("img picture svg canvas video audio iframe script style input select textarea".split(" "));
const unwrap = node => {
  while (node && (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node))) node = node.expression;
  return node;
};

/** Static parser; the public function below supplies the House ToolReturn envelope. */
const parseMarkup = (source, { name = "ImportedComposition" } = {}) => {
  if (typeof source !== "string" || !source.trim()) throw new Error("Supply a nonempty markup or component source string.");
  const warnings = new Set();
  const warn = message => warnings.add(message);
  const names = new Set();
  let nextId = 0;
  const cssName = value => {
    let base = String(value).replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "node";
    if (!/^[a-zA-Z_]/.test(base)) base = `node-${base}`;
    let candidate = base, suffix = 2;
    while (names.has(candidate)) candidate = `${base}-${suffix++}`;
    names.add(candidate);
    return candidate;
  };
  // TSX accepts ordinary HTML except HTML's unclosed void tags.
  const markup = source.trim().startsWith("<");
  const normalized = markup ? source.replace(/<(img|br|hr|input|meta|link|source|wbr|area|base|embed|param|track|col)\b([^<>]*?)(?<!\/)\s*>/gi, "<$1$2 />") : source;
  const code = markup ? `const __markup = <>${normalized}</>;` : source;
  const file = ts.createSourceFile("import.tsx", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (file.parseDiagnostics.length) throw new Error(ts.flattenDiagnosticMessageText(file.parseDiagnostics[0].messageText, " "));
  const literal = input => {
    const node = unwrap(input);
    if (!node) return undefined;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) return -Number(node.operand.text);
    if (ts.isObjectLiteralExpression(node)) {
      const value = {};
      for (const prop of node.properties) {
        if (!ts.isPropertyAssignment(prop)) { warn("Skipped dynamic/spread style properties."); continue; }
        const key = ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) ? prop.name.text : undefined;
        const entry = literal(prop.initializer);
        if (key && entry !== undefined && (typeof entry === "string" || typeof entry === "number")) value[key] = entry;
        else warn("Skipped dynamic style properties.");
      }
      return value;
    }
    return undefined;
  };
  const returned = body => {
    body = unwrap(body);
    if (!body) return undefined;
    if (!ts.isBlock(body)) return body;
    return body.statements.find(ts.isReturnStatement)?.expression;
  };
  const readExpression = input => {
    const node = unwrap(input);
    if (!node) return [];
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) return readJsx(node);
    const value = literal(node);
    if (typeof value === "string" || typeof value === "number") return [String(value)];
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "map") {
      const callback = node.arguments.find(arg => ts.isArrowFunction(arg) || ts.isFunctionExpression(arg));
      warn("Render loop imported as one template; iteration data was not evaluated.");
      return callback ? readExpression(returned(callback.body)) : [];
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
      warn("Conditional content imported without evaluating its condition.");
      return readExpression(node.right);
    }
    if (ts.isConditionalExpression(node)) {
      warn("Conditional expression imported using its first branch.");
      return readExpression(node.whenTrue);
    }
    if (node.kind !== ts.SyntaxKind.NullKeyword && node.kind !== ts.SyntaxKind.FalseKeyword && node.kind !== ts.SyntaxKind.TrueKeyword) warn(`Skipped dynamic expression: ${node.getText(file).slice(0, 100)}`);
    return [];
  };
  const readJsx = element => {
    if (ts.isJsxFragment(element)) return element.children.flatMap(readChild);
    const opening = ts.isJsxElement(element) ? element.openingElement : element;
    const tag = opening.tagName.getText(file);
    if (skip.has(tag)) return [];
    if (tag === "br") return [" "];
    const children = ts.isJsxElement(element) ? element.children.flatMap(readChild) : [];
    if (!tags.has(tag)) {
      warn(`Skipped <${tag}> wrapper; retained supported children.`);
      return children;
    }
    const attrs = {};
    for (const attr of opening.attributes.properties) {
      if (!ts.isJsxAttribute(attr)) { warn("Skipped spread attributes."); continue; }
      attrs[attr.name.getText(file)] = !attr.initializer ? true : ts.isStringLiteral(attr.initializer) ? attr.initializer.text : literal(attr.initializer.expression);
    }
    const classes = typeof (attrs.className ?? attrs.class) === "string" ? (attrs.className ?? attrs.class).split(/\s+/).filter(Boolean) : [];
    const custom = classes.find(value => !/^(container-|action-|effect-|scroll-|pad(?:-|$)|gap-)/.test(value));
    const node = { id: ++nextId, name: cssName(custom ?? attrs.id ?? tag), tag };
    for (const [prefix, field] of [["container-", "container_class"], ["action-", "action_class"], ["effect-", "effect_class"]]) {
      const values = classes.filter(value => value.startsWith(prefix));
      if (values.length) node[field] = values.join(" ");
    }
    if (classes.some(value => value === "scroll-x" || value === "scroll-both")) node.scroll_x = true;
    if (classes.some(value => value === "scroll-y" || value === "scroll-both")) node.scroll_y = true;
    for (const [attr, field] of [["data-grid", "grid_type"], ["data-area", "grid_area"]]) if (typeof attrs[attr] === "string") node[field] = attrs[attr];
    for (const [attr, field] of [["data-rows", "grid_rows"], ["data-cols", "grid_cols"]]) {
      const count = Number(attrs[attr]);
      if (Number.isInteger(count) && count >= 1 && count <= 12) node[field] = count;
    }
    const padding = classes.find(value => /^pad-(xs|sm|md|base|lg|xl)$/.test(value));
    if (padding) node.padding = padding.slice(4);
    if (typeof attrs["data-gap"] === "string") node.gap = attrs["data-gap"];
    if (typeof attrs.href === "string") node.href = attrs.href;
    if (attrs.disabled === true || attrs.disabled === "") node.disabled = true;
    if (attrs.style && typeof attrs.style === "object") node.css = attrs.style;
    else if (typeof attrs.style === "string") {
      node.css = {};
      for (const declaration of attrs.style.split(";")) {
        const colon = declaration.indexOf(":");
        if (colon < 0) continue;
        const property = declaration.slice(0, colon).trim();
        const key = property.startsWith("--") ? property : property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        node.css[key] = declaration.slice(colon + 1).trim();
      }
    }
    // Factory's text field precedes children. Wrap mixed text in spans to retain order.
    if (children.every(child => typeof child === "string")) {
      const text = children.join("").trim();
      if (text) node.text = text;
    } else {
      node.children = children.flatMap(child => typeof child === "string" ? child.trim() ? [{ id: ++nextId, name: cssName(`${node.name}-text`), tag: "span", text: child }] : [] : [child]);
      const areas = new Set();
      for (const child of node.children) if (child.grid_area) {
        if (areas.has(child.grid_area)) { delete child.grid_area; warn("Removed duplicate sibling grid_area."); }
        else areas.add(child.grid_area);
      }
    }
    return [node];
  };
  const readChild = child => ts.isJsxText(child) ? [child.text.replace(/\s+/g, " ")]
    : ts.isJsxExpression(child) ? readExpression(child.expression) : readJsx(child);
  let target;
  const find = node => {
    if (target) return;
    if (markup && ts.isVariableDeclaration(node) && node.name.getText(file) === "__markup") target = node.initializer;
    else if (ts.isReturnStatement(node) && node.expression && ts.isJsxElement(unwrap(node.expression))) target = node.expression;
    else if (ts.isArrowFunction(node) && !ts.isBlock(node.body) && (ts.isJsxElement(unwrap(node.body)) || ts.isJsxFragment(unwrap(node.body)) || ts.isJsxSelfClosingElement(unwrap(node.body)))) target = node.body;
    else if (ts.isReturnStatement(node) && node.expression && (ts.isJsxFragment(unwrap(node.expression)) || ts.isJsxSelfClosingElement(unwrap(node.expression)))) target = node.expression;
    if (!target) ts.forEachChild(node, find);
  };
  find(file);
  if (!target) throw new Error("No static JSX return or markup found. Supply markup or a component/demo containing JSX.");
  const nodes = readExpression(target).filter(value => typeof value !== "string" || value.trim());
  const root = nodes.length === 1 && typeof nodes[0] !== "string" ? nodes[0] : {
    id: ++nextId, name: cssName("imported-root"), tag: "div",
    children: nodes.map(node => typeof node === "string" ? { id: ++nextId, name: cssName("text"), tag: "span", text: node } : node),
  };
  return { document: { version: 2, name, root }, warnings: [...warnings] };
};

/**
 * Import markup without executing it. Loops contribute one static template.
 * @returns {import("../../../../../../../toolkit/HouseKeys.types.ts").ToolReturn}
 */
export const generateCompositionFromMarkup = (source, options = {}) => {
  const settings = { source, ...options };
  try {
    const { document, warnings } = parseMarkup(source, options);
    const response = { ...document, type: "composition", warnings };
    return { return_type: "results", status: "complete", settings, response };
  } catch (error) {
    return { return_type: "results", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [input, output] = process.argv.slice(2);
  if (!input) throw new Error("Usage: node src/dashboards/Factory/components/ComponentFactory/js/generateCompositionFromMarkup/generateCompositionFromMarkup.mjs input.tsx [output.json] (use - for stdin)");
  const source = input === "-" ? await new Promise(resolve => { let text = ""; process.stdin.setEncoding("utf8"); process.stdin.on("data", chunk => text += chunk); process.stdin.on("end", () => resolve(text)); }) : await readFile(input, "utf8");
  const result = generateCompositionFromMarkup(source);
  const json = JSON.stringify(result, null, 2) + "\n";
  if (output) await writeFile(output, json); else process.stdout.write(json);
  if (result.status === "error") process.exitCode = 1;
}

