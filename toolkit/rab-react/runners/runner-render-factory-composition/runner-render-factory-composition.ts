import { readFile, writeFile, rename, unlink, access } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import ts from "typescript";
import type { ToolsProps, ToolReturn } from "../../../Tooling.types.ts";
import type { RunnerCallbacks, RunnerReturn } from "../../../Runner.types.ts";
import { runTools } from "../../../runners/run-tools.ts";
import { run as refreshSettings } from "../../../tools/refresh-settings-json/refresh-settings-json.ts";
import { run as generateDependencies } from "../../tools/generate-dependencies.manifest-json/generate-dependencies.manifest-json.ts";
import { planReactScaffold } from "../run-react-scaffold.ts";
import { pascalCase } from "../../scaffolds/new-react-component/scaffold.ts";
import { resolveRunner } from "../resolve-runner.ts";
import { compositionExpression, replaceReturn } from "./replace-return.ts";
export { pascalCase } from "../../scaffolds/new-react-component/scaffold.ts";

export interface RenderFactoryCompositionProps extends ToolsProps {
  /** Artifact category. Component, page, or dashboard scaffold. */
  type: "component" | "subcomponent" | "page" | "dashboard";
  /** Name passed to the canonical component runner for normalization. */
  name: string;
  /** Destination project root with registered component paths. */
  path: string;
  /** One JSX root element that replaces only the component's return expression. */
  code: string;
  /** Complete stylesheet content written to the generated CSS import target. */
  css: string;
  /** Explicit consent to replace an existing component's return JSX and CSS. */
  overwrite?: boolean;
}

const pending = new Set<string>();
const runnerIds = { component: 1793138966741, subcomponent: 1793138966746, page: 1793138966755, dashboard: 1793138966759 };

export const run = async (settings: RenderFactoryCompositionProps, options: RunnerCallbacks = {}): Promise<RunnerReturn> => {
  if (!Object.hasOwn(runnerIds, settings.type)) throw Error("Unsupported artifact type.");
  if (typeof settings.code !== "string" || !settings.code.trim()) throw Error("code is required.");
  if (typeof settings.css !== "string") throw Error("css must be a string.");
  const code = compositionExpression(settings.code);
  const plan = await planReactScaffold(settings.type, settings);
  const name = pascalCase(settings.name);
  const folder = resolve(String(plan[0].settings.path), name);
  const lock = folder.toLowerCase();
  if (pending.has(lock)) throw Error("This component is already being saved.");
  pending.add(lock);
  try {
    let results: RunnerReturn = [];
    let created: NonNullable<ToolReturn["response"]>;
    try {
      created = JSON.parse(await readFile(resolve(folder, "rab.settings.json"), "utf8"));
      if ((settings.id !== undefined && created.id !== settings.id) || created.name !== name || created.type !== (settings.type === "subcomponent" ? "component" : settings.type)) {
        throw Error("Existing component identity does not match.");
      }
      const existingFile = resolve(folder, String(created.file));
      if (dirname(existingFile) !== folder) throw Error("Component implementation must be inside its generated folder.");
      await access(existingFile);
      if (settings.overwrite !== true) {
        return runTools([{ type: "tool", name: "confirm-factory-overwrite", settings }], () => ({
          status: "complete",
          settings,
          response: { ...created, type: "overwrite-confirmation" },
        }), options);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT" || settings.id !== undefined) throw error;
      const entry = await resolveRunner(runnerIds[settings.type], settings.path);
      const runner = await import(pathToFileURL(entry).href);
      results = await runner.run(settings, options);
      const result = results.find((item) => item.response?.id);
      if (!result || results.some((item) => item.status !== "complete")) return results;
      created = result.response!;
    }
    const written = await runTools([{ type: "tool", name: "write-factory-composition", settings }], async () => {
      const componentFile = resolve(folder, String(created.file));
      if (dirname(componentFile) !== folder) throw Error("Component implementation must be inside its generated folder.");
      const source = await readFile(componentFile, "utf8");
      const parsed = ts.createSourceFile(componentFile, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const stylesheet = parsed.statements.find((statement) =>
        ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text.endsWith(".css"),
      ) as ts.ImportDeclaration | undefined;
      if (!stylesheet || !ts.isStringLiteral(stylesheet.moduleSpecifier)) throw Error("Component stylesheet import is missing.");
      const cssFile = resolve(folder, stylesheet.moduleSpecifier.text);
      const localCss = relative(folder, cssFile);
      if (localCss.startsWith("..") || isAbsolute(localCss)) throw Error("Stylesheet must be inside the component folder.");
      await readFile(cssFile, "utf8");
      const exportName = settings.type === "page" && !name.endsWith("Page") ? `${name}Page` : name;
      const next = replaceReturn(source, exportName, code);
      const token = randomUUID();
      const componentTemp = componentFile + `.${token}.tmp`;
      const cssTemp = cssFile + `.${token}.tmp`;
      let componentWritten = false;
      try {
        await writeFile(componentTemp, next, { flag: "wx" });
        await writeFile(cssTemp, settings.css, { flag: "wx" });
        await rename(componentTemp, componentFile);
        componentWritten = true;
        await rename(cssTemp, cssFile);
      } catch (error) {
        if (componentWritten) await writeFile(componentFile, source);
        throw error;
      } finally {
        await unlink(componentTemp).catch(() => {});
        await unlink(cssTemp).catch(() => {});
      }
      return {
        status: "complete",
        settings,
        response: { ...created, summary: { count: 2 }, paths: [
          { path: dirname(componentFile), file: String(created.file), type: "tsx" },
          { path: dirname(cssFile), file: localCss.split(/[\\/]/).at(-1), type: "css" },
        ] },
      };
    }, options);
    if (written.some((item) => item.status !== "complete")) return [...results, ...written];
    const metadata = await runTools([
      { type: "tool", name: "generate-dependencies.manifest-json", settings: { ...settings, path: folder } },
      { type: "tool", name: "refresh-settings-json", settings: { ...settings, path: folder } },
    ], (step) => step.name === "refresh-settings-json"
      ? refreshSettings(step.settings)
      : generateDependencies(step.settings), options);
    return [...results, ...written, ...metadata];
  } finally {
    pending.delete(lock);
  }
};
