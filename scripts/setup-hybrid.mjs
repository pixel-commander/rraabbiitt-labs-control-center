import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { projectRoot } from "./world.mjs";

const windows = process.platform === "win32";
const temp = resolve(projectRoot, ".tmp/python-setup");
await mkdir(temp, { recursive: true });
const env = { ...process.env, TEMP: temp, TMP: temp, TMPDIR: temp, PYTHONNOUSERSITE: "1" };
const executable = resolve(projectRoot, windows ? ".venv/Scripts/python.exe" : ".venv/bin/python");
const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: projectRoot, env, stdio: "inherit", windowsHide: true, shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited ${result.status}.`);
};
let installed = true;
try { await access(executable); } catch { installed = false; }
if (!installed) {
  // PYTHON selects a system interpreter for installation, never another app's environment.
  const python = process.env.PYTHON ?? (windows ? "python" : "python3");
  run(python, ["-m", "venv", ".venv"]);
}
run(executable, ["-m", "ensurepip", "--upgrade"]);
run(executable, ["-m", "pip", "install", "--cache-dir", resolve(projectRoot, ".tmp/pip-cache"), "-r", resolve(projectRoot, "packages/hybrid-search-runtime/requirements.txt")]);
run(executable, ["-B", "-c", "import numpy, yaml, torch, sentence_transformers; print('Local hybrid search dependencies ready.')"]);
const file = resolve(projectRoot, "rab.world.json");
const world = JSON.parse(await readFile(file, "utf8"));
world.path = ".";
const entry = world.paths.find(row => row.name === "search-python");
if (!entry) throw new Error("Register search-python in rab.world.json.");
entry.path = windows ? ".venv/Scripts" : ".venv/bin";
entry.file = windows ? "python.exe" : "python";
await writeFile(file, JSON.stringify(world, null, 2) + "\n");
console.log("Hybrid search uses this project's local Python environment. No models were downloaded or trained.");
