import { readFile, readdir, stat, realpath, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname, join, relative, isAbsolute } from "node:path";
import { spawnSync } from "node:child_process";
import { projectRoot, loadWorld, withinProject } from "./world.mjs";

const errors = [];
const world = await loadWorld();
const locations = [...world.paths, ...world.toolkits, { name: "mcp", ...world.mcp }];
for (const entry of locations) {
  const folder = resolve(projectRoot, entry.path);
  try {
    if (!withinProject(projectRoot, await realpath(folder))) errors.push(`${entry.name}: external symlink target`);
    if (entry.file) await stat(resolve(folder, entry.file));
  } catch (error) { errors.push(`${entry.name}: ${error.message}`); }
}
const project = JSON.parse(await readFile(resolve(projectRoot, "rab.project.json"), "utf8"));
for (const entry of project.paths) {
  if (!withinProject(projectRoot, resolve(projectRoot, entry.path))) errors.push(`External project path: ${entry.path}`);
}
const skip = new Set(["node_modules", "template", "templates", ".git", ".tmp", "dist", ".venv", "__pycache__"]);
let imports = 0;
async function exists(file) { try { return (await stat(file)).isFile(); } catch { return false; } }
async function scan(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = join(folder, entry.name);
    if (entry.isDirectory()) { if (!skip.has(entry.name)) await scan(file); continue; }
    if (!/\.(?:ts|tsx|js|mjs)$/.test(file)) continue;
    const text = await readFile(file, "utf8");
    for (const match of text.matchAll(/(?:from\s*|import\s*\(\s*|import\s*)["'](\.[^"']+)["']/g)) {
      imports++;
      const target = resolve(dirname(file), match[1]);
      if (!withinProject(projectRoot, target)) { errors.push(`External import ${relative(projectRoot, file)}: ${match[1]}`); continue; }
      let found = false;
      for (const candidate of [target, ...[".ts", ".tsx", ".js", ".mjs", ".json", ".jsx"].map(ext => target + ext), join(target, "index.ts"), join(target, "index.tsx")]) {
        if (await exists(candidate)) { found = true; break; }
      }
      if (!found) errors.push(`Missing import ${relative(projectRoot, file)}: ${match[1]}`);
    }
  }
}
for (const folder of ["src", "ui", "api", "scripts", "toolkit", "tests", "db"]) await scan(resolve(projectRoot, folder));
const interpreter = world.paths.find(entry => entry.name === "search-python");
const python = resolve(projectRoot, interpreter.path, interpreter.file);
const checked = spawnSync(python, ["-B", "-c", [
  "import importlib.util,json,sys",
  "from pathlib import Path",
  "root=Path(sys.argv[1]).resolve()",
  "assert Path(sys.prefix).resolve().is_relative_to(root), 'Python environment escapes project'",
  "names=['numpy','yaml','torch','sentence_transformers','transformers']",
  "paths={name:str(Path(importlib.util.find_spec(name).origin).resolve()) for name in names}",
  "assert all(Path(path).is_relative_to(root) for path in paths.values()), paths",
  "print(json.dumps(paths))",
].join("\n"), projectRoot], { cwd: projectRoot, encoding: "utf8", windowsHide: true, env: { ...process.env, PYTHONNOUSERSITE: "1" } });
if (checked.status !== 0) errors.push(`Local Python dependency check: ${checked.stderr || checked.error?.message}`);
const report = { status: errors.length ? "FAIL" : "PASS", imports, root: projectRoot, runtime_locations: locations.length, local_python_packages: checked.status === 0 ? JSON.parse(checked.stdout) : null, errors };
const output = resolve(projectRoot, ".tmp/portability-audit");
await mkdir(output, { recursive: true });
await writeFile(resolve(output, "audit.json"), JSON.stringify(report, null, 2) + "\n");
console.log(`${report.status}: ${imports} local imports; ${locations.length} contained runtime locations.`);
for (const error of errors) console.error(error);
if (errors.length) process.exitCode = 1;
