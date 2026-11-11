import type { RunnerCallbacks } from "../../../Runner.types.ts";
import { runTools } from "../../../rab-world/runners/run-tools.ts";
import { planReactScaffold, executePlannedReactScaffold } from "../run-react-scaffold.ts";
import { spawn } from "node:child_process";
import { closeSync, openSync, existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, stat } from "node:fs/promises";
import { isAbsolute, join, resolve, dirname, basename } from "node:path";
import type { ToolsProps, ToolReturn } from "../../../Tooling.types.ts";

const command = (type: string) => {
  const args = type === "install" ? ["install"] : ["run", "dev"];
  const candidates = [
    process.env.npm_execpath,
    join(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js"),
    resolve(dirname(process.execPath), "../lib/node_modules/npm/bin/npm-cli.js"),
  ];
  const cli = candidates.find((path): path is string => Boolean(path && basename(path) === "npm-cli.js" && existsSync(path)));
  if (cli) return { executable: process.execPath, args: [cli, ...args] };
  if (process.platform === "win32") throw new Error("Cannot locate npm-cli.js beside Node; run with npm_execpath set to the installed npm CLI.");
  return { executable: "npm", args };
};

const stop = async (pid: number) => {
  if (process.platform === "win32") {
    await new Promise<void>((done) => {
      const child = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
      child.on("error", () => done());
      child.on("close", () => done());
    });
  } else {
    try { process.kill(-pid, "SIGTERM"); } catch { /* Already stopped. */ }
  }
};

/** Execute only the two npm lifecycle operations used by the project kit. */
const runNpm = async (settings: ToolsProps): Promise<ToolReturn> => {
  try {
    if (typeof settings.path !== "string" || !isAbsolute(settings.path))
      throw new Error("Supply an absolute project path.");
    if (settings.type !== "install" && settings.type !== "dev")
      throw new Error("Supply type install or dev.");
    const cwd = resolve(settings.path);
    const pkg = JSON.parse(await readFile(join(cwd, "package.json"), "utf8"));
    if (settings.type === "dev" && typeof pkg.scripts?.dev !== "string")
      throw new Error("Project needs a dev script.");
    const temporary = join(cwd, ".tmp");
    await mkdir(temporary, { recursive: true });
    const logs = await mkdtemp(join(temporary, `npm-${settings.type}-`));
    const stdout = join(logs, "stdout.log");
    const stderr = join(logs, "stderr.log");
    const out = openSync(stdout, "wx");
    const err = openSync(stderr, "wx");
    const { executable, args } = command(settings.type);
    let child;
    try {
      child = spawn(executable, args, {
        cwd, windowsHide: true, detached: true,
        stdio: ["ignore", out, err], env: { ...process.env, NO_COLOR: "1" },
      });
    } finally { closeSync(out); closeSync(err); }
    let ended = false;
    let failure: string | undefined;
    child.on("error", (error) => { failure = error.message; ended = true; });
    child.on("exit", (code, signal) => {
      ended = true;
      if (code !== 0) failure = `npm ${settings.type === "install" ? "install" : "run dev"} exited (${code ?? signal}).`;
    });
    const started = Date.now();
    const timeout = settings.type === "install" ? 180_000 : 45_000;
    let url: string | undefined;
    while (Date.now() - started < timeout) {
      if (ended) break;
      if (settings.type === "dev") {
        const output = (await readFile(stdout, "utf8")).replace(/\x1b\[[0-9;]*m/g, "");
        const candidate = output.match(/Local:\s+(http:\/\/(?:localhost|127\.0\.0\.1|\[::1\]):\d+\/?)/)?.[1];
        if (candidate) {
          try {
            const response = await fetch(candidate, { signal: AbortSignal.timeout(1000), redirect: "error" });
            await response.body?.cancel();
            if (response.ok && !ended) { url = candidate; break; }
          } catch { /* Wait until the local server responds. */ }
        }
      }
      await new Promise((done) => setTimeout(done, 200));
    }
    const paths = [{ path: logs, file: "stdout.log", type: "log" }, { path: logs, file: "stderr.log", type: "log" }];
    const successful = settings.type === "install" ? ended && !failure : Boolean(url) && !ended;
    if (!successful) {
      if (child.pid) await stop(child.pid);
      const details = (await readFile(stderr, "utf8")).slice(-3000);
      return { status: "error", settings, error: `${failure ?? (ended ? "Dev server exited before becoming ready." : "npm step timed out.")} ${details}`.trim(), response: { path: cwd, paths } };
    }
    if (settings.type === "install") {
      await stat(join(cwd, "package-lock.json"));
    } else child.unref();
    return { status: "complete", settings, response: { path: cwd, paths, body: JSON.stringify({ command: settings.type === "install" ? "npm install" : "npm run dev", pid: child.pid, ...(url ? { url } : {}) }) } };
  } catch (error) {
    return { status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
};

/** Create, install and start through one shared tracking owner. */
export const run = (settings: ToolsProps, options: RunnerCallbacks = {}) => {
  const input = {
    ...settings,
    title: settings.title ?? String(settings.name ?? "")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" "),
  };
  let project: string | undefined;
  let installed = false;
  return runTools(
    async () => [
      ...(await planReactScaffold("project", input)),
      { type: "tool" as const, name: "npm-install", settings: { ...input, type: "install" } },
      { type: "tool" as const, name: "npm-run-dev", settings: { ...input, type: "dev" } },
    ],
    async (step): Promise<ToolReturn> => {
      if (step.name === "new-react-project") {
        const result = await executePlannedReactScaffold("project", input, step);
        if (result.status === "complete" && result.response?.path)
          project = resolve(String(settings.path), result.response.path);
        return result;
      }
      if (!project || (step.name === "npm-run-dev" && !installed))
        return { status: "error", settings: step.settings, error: "Skipped: prerequisite project creation or npm install failed." };
      const result = await runNpm({ ...step.settings, path: project });
      if (step.name === "npm-install") installed = result.status === "complete";
      return result;
    },
    options,
  );
};
