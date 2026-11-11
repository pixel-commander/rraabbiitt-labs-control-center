import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import type { ToolsProps, ToolReturn } from "../../Tooling.types.ts";

const MAX_RESPONSE_BYTES = 4_000_000;
const STDERR_BYTES = 4_000;
const REQUEST_TIMEOUT_MS = 300_000;
const operations: Record<string, string> = {
  "search_hybrid_seat_ranking.py": "search",
  "train_field_feedback.py": "feedback",
  "train_hybrid_seat_ranking.py": "train",
};
const workerPath = fileURLToPath(new URL("./worker.py", import.meta.url));
const bundledPython = fileURLToPath(
  new URL(
    "../../../models/hybrid-seat-ranking/.venv/Scripts/python.exe",
    import.meta.url,
  ),
);
const python =
  process.env.TOOL_LEARNER_PYTHON ??
  (existsSync(bundledPython) ? bundledPython : "python");

interface PendingRequest {
  resolve: (value: ToolReturn) => void;
  reject: (reason: Error) => void;
  timer: NodeJS.Timeout;
}

let child: ChildProcessWithoutNullStreams | undefined;
let stdoutBuffer = "";
let stderrBuffer = "";
let nextId = 0;
const pending = new Map<string, PendingRequest>();

const rejectAll = (error: Error): void => {
  for (const request of pending.values()) {
    clearTimeout(request.timer);
    request.reject(error);
  }
  pending.clear();
};

const stopWorker = (): void => {
  if (child && !child.killed) child.kill();
};

const setWorkerReferenced = (
  worker: ChildProcessWithoutNullStreams,
  referenced: boolean,
): void => {
  if (referenced) worker.ref();
  else worker.unref();
  for (const stream of [worker.stdin, worker.stdout, worker.stderr]) {
    const handle = stream as typeof stream & {
      ref?: () => void;
      unref?: () => void;
      _handle?: { ref?: () => void; unref?: () => void };
    };
    const method = referenced ? "ref" : "unref";
    if (handle[method]) handle[method]?.();
    else handle._handle?.[method]?.();
  }
};

const unrefIfIdle = (worker: ChildProcessWithoutNullStreams): void => {
  if (child === worker && pending.size === 0)
    setWorkerReferenced(worker, false);
};

process.once("exit", stopWorker);

const ensureWorker = (): ChildProcessWithoutNullStreams => {
  if (child && child.exitCode === null && !child.killed) return child;
  stdoutBuffer = "";
  stderrBuffer = "";
  const processChild = spawn(python, ["-u", "-B", workerPath], {
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe"],
  });
  child = processChild;
  processChild.stdout.setEncoding("utf8");
  processChild.stderr.setEncoding("utf8");
  processChild.stdout.on("data", (chunk: string) => {
    if (child !== processChild) return;
    stdoutBuffer += chunk;
    if (
      Buffer.byteLength(stdoutBuffer) > MAX_RESPONSE_BYTES &&
      !stdoutBuffer.includes("\n")
    ) {
      processChild.kill();
      rejectAll(new Error("Worker response exceeded 4 MB."));
      return;
    }
    let newline = stdoutBuffer.indexOf("\n");
    while (newline >= 0) {
      const line = stdoutBuffer.slice(0, newline);
      stdoutBuffer = stdoutBuffer.slice(newline + 1);
      if (Buffer.byteLength(line) > MAX_RESPONSE_BYTES) {
        processChild.kill();
        rejectAll(new Error("Worker response exceeded 4 MB."));
        return;
      }
      try {
        const message = JSON.parse(line) as {
          id?: string;
          result?: ToolReturn;
        };
        const request =
          message.id === undefined ? undefined : pending.get(message.id);
        if (!request) {
          newline = stdoutBuffer.indexOf("\n");
          continue;
        }
        pending.delete(message.id as string);
        clearTimeout(request.timer);
        if (message.result && typeof message.result === "object")
          request.resolve({ ...message.result, return_type: "summary" });
        else
          request.reject(new Error("Worker returned an invalid ToolReturn."));
        unrefIfIdle(processChild);
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        rejectAll(
          new Error(
            `Invalid worker response: ${detail}${stderrBuffer ? ` (${stderrBuffer})` : ""}`,
          ),
        );
        processChild.kill();
        return;
      }
      newline = stdoutBuffer.indexOf("\n");
    }
  });
  processChild.stderr.on("data", (chunk: string) => {
    if (child !== processChild) return;
    stderrBuffer = (stderrBuffer + chunk).slice(-STDERR_BYTES);
  });
  processChild.on("error", (error) => {
    if (child !== processChild) return;
    child = undefined;
    rejectAll(
      new Error(`${error.message}${stderrBuffer ? ` (${stderrBuffer})` : ""}`),
    );
  });
  processChild.on("close", (code) => {
    if (child !== processChild) return;
    child = undefined;
    rejectAll(
      new Error(
        `Python worker exited (${code ?? "signal"}).${stderrBuffer ? ` ${stderrBuffer}` : ""}`,
      ),
    );
  });
  return processChild;
};

export const execute = (
  settings: ToolsProps,
  script: URL,
): Promise<ToolReturn> => {
  const operation = operations[basename(fileURLToPath(script))];
  if (!operation)
    return Promise.resolve({ return_type: "summary",
      status: "error",
      settings,
      error: "Unsupported hybrid ranking tool operation.",
    });
  return new Promise((resolve, reject) => {
    const id = `${process.pid}-${++nextId}`;
    const worker = ensureWorker();
    setWorkerReferenced(worker, true);
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error("Python worker request timed out."));
      worker.kill();
    }, REQUEST_TIMEOUT_MS);
    pending.set(id, { resolve, reject, timer });
    const message = `${JSON.stringify({ id, operation, settings })}\n`;
    worker.stdin.write(message, (error) => {
      if (!error) return;
      const request = pending.get(id);
      if (!request) return;
      pending.delete(id);
      clearTimeout(request.timer);
      request.reject(
        new Error(
          `${error.message}${stderrBuffer ? ` (${stderrBuffer})` : ""}`,
        ),
      );
      worker.kill();
    });
  });
};
