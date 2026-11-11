import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { resolve, relative, dirname, join, extname, isAbsolute, sep, basename } from "node:path";
import ts from "typescript";
import type { Tool, ToolsProps, ToolReturn } from "../../../Tooling.types.ts";

const slash = (value: string) => value.replaceAll("\\", "/");
const outside = (root: string, target: string) => {
  const path = relative(root, target);
  return path === ".." || path.startsWith(`..${sep}`) || isAbsolute(path);
};
const collect = async (folder: string): Promise<string[]> => {
  const result: string[] = [];
  for (const item of (await readdir(folder, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(folder, item.name);
    if (item.isDirectory() && !["demo", "tests", "__tests__", "node_modules", "dist", ".git"].includes(item.name)) result.push(...await collect(path));
    else if (item.isFile() && /\.(?:[cm]?[jt]sx?|css)$/.test(item.name) && !/\.(?:test|spec)\./.test(item.name)) result.push(path);
  }
  return result;
};
export const run: Tool = async (settings: ToolsProps): Promise<ToolReturn> => {
  try {
    if (settings.paths !== undefined && !Array.isArray(settings.paths)) throw Error("paths must be an array of path records.");
    const supplied = [...(settings.path !== undefined ? [settings.path] : []), ...(settings.paths ?? []).map(item => item.path)];
    if (!supplied.length || supplied.some(path => typeof path !== "string" || !path.trim())) throw Error("Supply path or paths: [{ path }].");
    const roots = [...new Set(supplied.map(path => resolve(path!)))];
    const outputs = [];
    // Scan every destination before overwriting any manifests.
    for (const root of roots) {
      if (!(await stat(root)).isDirectory()) throw Error(`Expected a folder: ${root}`);
      const paths: { name: string; path: string; type: string; file: string }[] = [];
      for (const file of await collect(root)) {
        const source = await readFile(file, "utf8");
        const imports: string[] = [];
        if (extname(file) === ".css") {
          const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
          for (const match of css.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/g)) imports.push(match[1]);
        } else {
          const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
          const visit = (node: ts.Node) => {
            if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
            if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) imports.push(node.arguments[0].text);
            if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) imports.push(node.argument.literal.text);
            ts.forEachChild(node, visit);
          };
          visit(tree);
        }
        for (const specifier of imports) {
          if (!specifier.startsWith("../")) continue;
          const target = resolve(dirname(file), specifier);
          if (!outside(root, target)) continue;
          paths.push({ name: specifier, path: slash(relative(root, target)), type: "import", file: slash(relative(root, file)) });
        }
      }
      outputs.push({ root, manifest: { name: basename(root), type: "dependencies", paths } });
    }
    for (const { root, manifest } of outputs) await writeFile(join(root, "dependencies.manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
    return { status: "complete", settings, response: { summary: { count: outputs.length }, paths: outputs.map(({root}) => ({ path: slash(root), file: "dependencies.manifest.json", type: "json" })) } };
  } catch (error) {
    return { status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
};
