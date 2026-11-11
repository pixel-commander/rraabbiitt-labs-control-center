import { spawn } from "node:child_process";
import { readFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { dirname, resolve, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { run as exportCatalog } from "../../tools/export-search-catalog/export-search-catalog.ts";
import type { ToolsProps, ToolReturn } from "../../Tooling.types.ts";

const toolsDirectory = dirname(fileURLToPath(import.meta.url));
const defaultProject = resolve(toolsDirectory, "../../..");
const read = async (path: string) => JSON.parse(await readFile(path, "utf8"));

export const searchProject = (settings: ToolsProps) => runProject(settings, "search");
export const feedbackProject = async (settings: ToolsProps): Promise<ToolReturn> => ({
  return_type: "results", status: "error", settings,
  error: "The shipped hybrid baseline is read-only. Save customer lessons through the search feedback API.",
});

const runProject = async (settings: ToolsProps, operation: "search" | "feedback"): Promise<ToolReturn> => {
  let temporary: string | undefined;
  try {
    if (typeof settings.query !== "string" || !settings.query.trim() || settings.query.length > 2000)
      throw new Error("Supply a query of 1 to 2000 characters.");
    const projectPath = operation === "search" ? settings.path : settings.save_path;
    const project = resolve(typeof projectPath === "string" ? projectPath : defaultProject);
    const world = await read(resolve(project, "rab.world.json"));
    const entry = (name: string) => {
      const matches = world.paths.filter((row: { name: string }) => row.name === name);
      if (matches.length !== 1) throw new Error(`Register exactly one ${name} location in rab.world.json.`);
      return matches[0];
    };
    const model = resolve(project, entry("hybrid-seat-ranking").path);
    const childPath = relative(project, model);
    if (childPath.startsWith("..") || isAbsolute(childPath)) throw new Error("Model state must stay inside its project.");
    const python = entry("search-python");
    const projectConfig = await read(resolve(project, "rab.project.json"));
    const databases = projectConfig.paths.filter((row: { name: string }) => row.name === "database");
    if (databases.length !== 1) throw new Error("Register exactly one catalog database in rab.project.json.");
    const temporaryRoot = resolve(defaultProject, ".tmp/hybrid-search/requests");
    await mkdir(temporaryRoot, { recursive: true });
    temporary = await mkdtemp(resolve(temporaryRoot, "search-"));
    const catalog = resolve(temporary, "catalog.json");
    const exported = await exportCatalog({
      path: resolve(project, databases[0].path, databases[0].file), save_path: catalog,
      ...(settings.message !== undefined ? { message: settings.message } : {}),
    });
    if (exported.status !== "complete") throw new Error(exported.error || "Catalog export failed.");
    return await new Promise<ToolReturn>((done, fail) => {
      const worker = spawn(resolve(project, python.path, python.file), ["-B", resolve(toolsDirectory, "project_search.py"), "--project", project, "--catalog", catalog, "--operation", operation], {
        cwd: project, windowsHide: true, stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env, HF_HUB_OFFLINE: "1", TRANSFORMERS_OFFLINE: "1", PYTHONIOENCODING: "utf-8" },
      });
      let output = "", errors = "";
      const timer = setTimeout(() => { worker.kill(); fail(new Error("Project search timed out after 240 seconds.")); }, 240_000);
      worker.stdout.on("data", (chunk) => {
        output += chunk;
        if (output.length > 4_000_000) { worker.kill(); fail(new Error("Search response exceeded 4 MB.")); }
      });
      worker.stderr.on("data", (chunk) => { errors = (errors + chunk).slice(-4000); });
      worker.on("error", (error) => { clearTimeout(timer); fail(error); });
      worker.on("close", (code) => {
        clearTimeout(timer);
        try {
          const result = JSON.parse(output);
          if (!result || !["complete", "error"].includes(result.status)) throw new Error("Invalid search return.");
          done({ ...result, return_type: operation === "search" ? "results" : "settings", settings });
        } catch { fail(new Error(`Project search exited (${code}). ${errors || output}`)); }
      });
      worker.stdin.on("error", (error) => { clearTimeout(timer); fail(error); });
      worker.stdin.end(JSON.stringify(settings));
    });
  } catch (error) {
    return { return_type: "results", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  } finally {
    if (temporary) {
      const temporaryRoot = resolve(defaultProject, ".tmp/hybrid-search/requests");
      const child = relative(temporaryRoot, resolve(temporary));
      if (!child || child.startsWith("..") || isAbsolute(child)) throw new Error("Unsafe request cleanup path.");
      await rm(temporary, { recursive: true, force: true });
    }
  }
};

