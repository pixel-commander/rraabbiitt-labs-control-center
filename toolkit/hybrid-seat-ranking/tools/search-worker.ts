import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";
import type { ToolReturn, ToolsProps } from "../../Tooling.types.ts";

const workers = new Map<string, ReturnType<typeof createWorker>>();
let sequence = 0;
const inside = (root: string, path: string) => {
  const child = relative(root, path);
  if (child.startsWith("..") || isAbsolute(child)) throw Error("Model asset escapes the registered model.");
  return path;
};
/** Stat the pinned assets and checkpoint data, not the whole model tree. */
async function revision(model: string) {
  const pointer = await readFile(resolve(model, "checkpoints/active.json"), "utf8");
  const folder = inside(model, resolve(model, JSON.parse(pointer).checkpoint));
  const engine = await readFile(resolve(folder, "engine.json"), "utf8");
  const config = JSON.parse(engine);
  const files = ["vectors.npz", "examples.json", "record-examples.json"].map(name => resolve(folder, name));
  for (const spec of [config.model, config.reranker].filter(Boolean))
    for (const name of Object.keys(spec.file_sha256)) files.push(inside(model, resolve(model, spec.path, name)));
  return JSON.stringify([pointer, engine, await Promise.all(files.map(async file => {
    const info = await stat(file); return [file, info.size, info.mtimeMs, info.ctimeMs];
  }))]);
}
function createWorker(python: string, script: string, project: string, key: string) {
  const child = spawn(python, ["-B", script, "--project", project, "--worker"], {
    cwd: project, windowsHide: true, stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, HF_HUB_OFFLINE: "1", TRANSFORMERS_OFFLINE: "1", PYTHONIOENCODING: "utf-8", PYTHONNOUSERSITE: "1" },
  });
  const pending = new Map<number, {done: (value: ToolReturn) => void; fail: (error: Error) => void; timer: ReturnType<typeof setTimeout>}>();
  let output = "", errors = "", stopped = false;
  const refs = (active: boolean) => {
    if (active) child.ref(); else child.unref();
    for (const stream of [child.stdin, child.stdout, child.stderr]) {
      const handle = stream as typeof stream & {ref?: () => void; unref?: () => void};
      if (active) handle.ref?.(); else handle.unref?.();
    }
  };
  const stop = (error = new Error("Search worker stopped.")) => {
    if (stopped) return;
    stopped = true;
    for (const item of pending.values()) { clearTimeout(item.timer); item.fail(error); }
    pending.clear(); child.kill(); refs(false);
    if (workers.get(project)?.key === key) workers.delete(project);
  };
  child.stdout.setEncoding("utf8").on("data", chunk => {
    output += chunk;
    if (Buffer.byteLength(output) > 8_000_000) return stop(new Error("Search response exceeded 8 MB."));
    let end;
    while ((end = output.indexOf("\n")) >= 0) {
      const line = output.slice(0, end); output = output.slice(end + 1);
      try {
        const {id, result} = JSON.parse(line);
        const item = pending.get(id);
        if (!item || !["complete", "error"].includes(result?.status)) throw Error("Invalid search worker return.");
        pending.delete(id); clearTimeout(item.timer); item.done(result);
      } catch (error) { return stop(error instanceof Error ? error : new Error(String(error))); }
    }
    if (!pending.size) refs(false);
  });
  child.stderr.setEncoding("utf8").on("data", chunk => { errors = (errors + chunk).slice(-4000); });
  child.on("error", stop);
  child.stdin.on("error", stop);
  child.on("close", code => stop(new Error(`Search worker exited (${code}). ${errors}`)));
  return { key, stop, request(catalog: string, settings: ToolsProps): Promise<ToolReturn> {
    if (stopped) return Promise.reject(new Error("Search worker is closed."));
    refs(true);
    return new Promise((done, fail) => {
      const id = ++sequence;
      const timer = setTimeout(() => stop(new Error("Project search timed out after 240 seconds.")), 240_000);
      pending.set(id, {done, fail, timer});
      child.stdin.write(JSON.stringify({id, catalog, settings}) + "\n");
    });
  }};
}
export async function searchWorker(project: string, model: string, python: string, script: string, catalog: string, settings: ToolsProps) {
  const key = JSON.stringify([python, await readFile(resolve(project, "rab.world.json"), "utf8"), await revision(model)]);
  let worker = workers.get(project);
  if (worker && worker.key !== key) { worker.stop(new Error("Model configuration changed. Retry this query.")); worker = undefined; }
  if (!worker) { worker = createWorker(python, script, project, key); workers.set(project, worker); }
  return worker.request(catalog, settings);
}
export function stopSearchWorkers() { for (const worker of workers.values()) worker.stop(); }
process.once("exit", stopSearchWorkers);
