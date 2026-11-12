import { DatabaseSync } from "node:sqlite";
import { projectRoot, withinProject } from "../../../../scripts/world.mjs";
import { executeTool as refreshCatalog } from "../../../tools/refresh-world-database/refresh-world-database.ts";
import { readFile, realpath, readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { isAbsolute, relative, resolve, sep, win32 } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ToolReturn } from "../../../Tooling.types.ts";
import type {
  RunnersProps,
  RunnerCallbacks,
  RunnerReturn,
  RunProps,
} from "../../../Runner.types.ts";
import { runTools } from "../run-tools.ts";

type ToolRegistration = {
  id: number;
  name: string;
  title?: string;
  description?: string;
  type: string;
  path: string;
  file: string;
  settings?: unknown[];
  root: string;
};

function isWithin(root: string, location: string) {
  const child = relative(root, location);
  return (
    child !== ".." &&
    !child.startsWith(`..${sep}`) &&
    !isAbsolute(child) &&
    !win32.isAbsolute(child)
  );
}

async function readToolkitRegistrations(
  toolkits: unknown,
): Promise<ToolRegistration[]> {
  if (!Array.isArray(toolkits))
    throw new Error("rab_world.toolkits is missing or invalid.");
  const records: ToolRegistration[] = [];
  const roots = new Set<string>();
  for (const toolkit of toolkits) {
    if (
      !toolkit ||
      typeof toolkit.path !== "string" ||
      !isAbsolute(toolkit.path)
    )
      throw new Error("Each rab_world toolkit requires an absolute path.");
    const root = await realpath(toolkit.path);
    if (roots.has(root)) continue;
    roots.add(root);
    const visit = async (folder: string): Promise<void> => {
      const entries = await readdir(folder, { withFileTypes: true });
      entries.sort((a, b) => a.name.localeCompare(b.name));
      for (const entry of entries) {
        if (entry.isSymbolicLink()) continue;
        const location = resolve(folder, entry.name);
        if (entry.isDirectory()) {
          if (
            !["node_modules", ".git", "template", "templates", "dist"].includes(
              entry.name,
            )
          )
            await visit(location);
        } else if (entry.isFile() && entry.name === "rab.settings.json") {
          const record = JSON.parse(await readFile(location, "utf8"));
          if (record.type !== "tool" && record.type !== "runner") continue;
          if (
            !Number.isSafeInteger(record.id) ||
            record.id <= 0 ||
            typeof record.name !== "string" ||
            typeof record.file !== "string"
          )
            throw new Error(`Invalid tool registration: ${location}`);
          if (records.some((item) => item.id === record.id))
            throw new Error(`Duplicate tool ID: ${record.id}`);
          records.push({ ...record, path: folder, root });
        }
      }
    };
    await visit(root);
  }
  return records;
}

/** Resolve IDs through the catalog, then trust only current metadata inside supplied roots. */
async function indexedRegistrations(toolkits: unknown, id?: number): Promise<ToolRegistration[]> {
  if (!Array.isArray(toolkits)) throw new Error("rab_world.toolkits is missing or invalid.");
  const roots: string[] = [];
  for (const toolkit of toolkits) {
    if (!toolkit || typeof toolkit.path !== "string" || !isAbsolute(toolkit.path))
      throw new Error("Each rab_world toolkit requires an absolute path.");
    roots.push(await realpath(toolkit.path));
  }
  if (!roots.length) return [];
  const config = JSON.parse((await readFile(resolve(projectRoot, "rab.project.json"), "utf8")).replace(/^\uFEFF/, ""));
  const entries = config.paths.filter((row: {name: string}) => row.name === "database");
  if (entries.length !== 1) throw new Error("Register exactly one catalog database.");
  const database = resolve(projectRoot, entries[0].path, entries[0].file);
  if (!withinProject(projectRoot, await realpath(database))) throw new Error("Catalog database escapes this world.");
  const load = async () => {
    const db = new DatabaseSync(database, { readOnly: true });
    let rows;
    try {
      rows = id === undefined
        ? db.prepare("SELECT id,path FROM records WHERE type IN ('tool','runner')").all()
        : db.prepare("SELECT id,path FROM records WHERE id = ? AND type IN ('tool','runner')").all(id);
    } finally { db.close(); }
    const records: ToolRegistration[] = [];
    for (const row of rows) {
      const folder = resolve(projectRoot, String(row.path));
      const root = roots.find(root => isWithin(root, folder));
      if (!root) continue;
      try {
        const actual = await realpath(folder);
        if (!isWithin(root, actual)) throw new Error("Indexed tool resolves outside its toolkit.");
        const record = JSON.parse((await readFile(resolve(actual, "rab.settings.json"), "utf8")).replace(/^\uFEFF/, ""));
        if (record.id !== row.id || !["tool", "runner"].includes(record.type)) continue;
        if (typeof record.file !== "string" || typeof record.name !== "string") throw new Error("Invalid indexed tool registration.");
        records.push({ ...record, path: actual, root });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
    return records;
  };
  let records = await load();
  if (!records.length) {
    const refreshed = await refreshCatalog({path: projectRoot});
    if (refreshed.status !== "complete") throw new Error(refreshed.error || "Catalog refresh failed.");
    records = await load();
    // Explicitly supplied toolkits outside this world's source registration remain supported.
    if (!records.length) records = (await readToolkitRegistrations(toolkits)).filter(row => id === undefined || row.id === id);
  }
  return records;
}

async function withSkill(result: ToolReturn): Promise<ToolReturn> {
  if (result.status !== "complete") return result;
  const response = result.response;
  const paths = response?.paths;
  if (!response || !paths?.length)
    throw new Error("Tool loader returned no registration.");
  const registration = paths[0] as ToolRegistration;
  const projectRoot = registration.root;
  const folder = resolve(projectRoot, registration.path);
  if (!isWithin(projectRoot, folder))
    throw new Error("Registered tool path escapes the project root.");
  const realFolder = await realpath(folder);
  if (!isWithin(projectRoot, realFolder))
    throw new Error("Registered tool path resolves outside the project root.");
  let skillFile: string | undefined;
  for (const file of ["use.skill.yaml", "skills.yaml"]) {
    try {
      const candidate = resolve(realFolder, file);
      if (isWithin(projectRoot, candidate)) {
        await realpath(candidate);
        skillFile = candidate;
        break;
      }
    } catch {
      /* The adjacent skill file is optional. */
    }
  }
  const skills = skillFile
    ? [
        {
          name: skillFile.endsWith("use.skill.yaml") ? "use-skill" : "skills",
          type: "skill",
          path: relative(projectRoot, skillFile).replaceAll("\\", "/"),
          file: skillFile.split(/[\\/]/).at(-1),
          instructions: await readFile(skillFile, "utf8"),
        },
      ]
    : [];
  return {
    ...result,
    response: {
      ...response,
      paths: paths.map((path) => ({ ...path, skills })),
    },
  };
}

async function executeRegisteredTool(
  registration: ToolRegistration,
  settings: Record<string, unknown>,
): Promise<ToolReturn> {
  if (registration.type !== "tool")
    throw new Error("Only registered tools can be executed.");
  const projectRoot = registration.root;
  const folder = resolve(projectRoot, registration.path);
  if (!isWithin(projectRoot, folder))
    throw new Error("Registered tool path escapes the project root.");
  const realFolder = await realpath(folder);
  const entry = resolve(realFolder, registration.file);
  const realEntry = await realpath(entry);
  if (!isWithin(projectRoot, realEntry) || !isWithin(realFolder, realEntry))
    throw new Error("Tool entry file escapes its registered folder.");

  if (realEntry.endsWith(".py")) {
    return new Promise((resolveResult) => {
      const child = spawn(
        process.env.TOOL_LEARNER_PYTHON ?? "python",
        ["-B", realEntry],
        {
          cwd: projectRoot,
          windowsHide: true,
          stdio: ["pipe", "pipe", "pipe"],
        },
      );
      let stdout = "";
      let stderr = "";
      let settled = false;
      const finish = (result: ToolReturn) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolveResult(result);
      };
      const timer = setTimeout(() => {
        child.kill();
        finish({ return_type: "results",
          status: "error",
          settings,
          error: "Tool execution timed out.",
        });
      }, 120000);
      child.stdout.setEncoding("utf8").on("data", (chunk) => {
        stdout += chunk;
        if (Buffer.byteLength(stdout) > 8_000_000) {
          child.kill();
          finish({ return_type: "results",
            status: "error",
            settings,
            error: "Tool response is too large.",
          });
        }
      });
      child.stderr.setEncoding("utf8").on("data", (chunk) => {
        stderr = (stderr + chunk).slice(-4000);
      });
      child.on("error", (error) =>
        finish({ return_type: "results", status: "error", settings, error: error.message }),
      );
      child.stdin.on("error", (error) =>
        finish({ return_type: "results", status: "error", settings, error: error.message }),
      );
      child.on("close", (code) => {
        try {
          const returned = JSON.parse(stdout) as ToolReturn;
          if (returned.status !== "complete" && returned.status !== "error")
            throw new Error("Invalid tool response.");
          if (code !== 0 && returned.status !== "error")
            throw new Error(stderr || `Python exited ${code}.`);
          finish({ ...returned, settings });
        } catch (error) {
          finish({ return_type: "results",
            status: "error",
            settings,
            error:
              stderr ||
              (error instanceof Error ? error.message : String(error)),
          });
        }
      });
      child.stdin.end(JSON.stringify(settings));
    });
  }

  if (
    ![".ts", ".js", ".mjs"].some((extension) => realEntry.endsWith(extension))
  ) {
    throw new Error("Tool entry must be a .py, .ts, .js, or .mjs file.");
  }
  const imported = (await import(pathToFileURL(realEntry).href)) as {
    run?: (props: Record<string, unknown>) => ToolReturn | Promise<ToolReturn>;
  };
  if (typeof imported.run !== "function")
    throw new Error("Tool entry does not export a run function.");
  const returned = await imported.run(settings);
  if (
    !returned ||
    (returned.status !== "complete" && returned.status !== "error")
  )
    throw new Error("Tool returned an invalid ToolReturn.");
  return { ...returned, settings };
}

export const run = async (
  props: RunnersProps,
  options: RunnerCallbacks = {},
): Promise<RunnerReturn> => {
  const settings = { ...props };
  const hasQuery = typeof settings.query === "string";
  const hasId = typeof settings.id === "number";
  if (hasQuery === hasId) {
    throw new Error(
      "Supply either query to search or id to load or execute one tool.",
    );
  }

  const registrations = await indexedRegistrations(settings.toolkits, hasId ? settings.id : undefined);
  if (hasQuery) {
    const query = settings.query!.trim().toLowerCase();
    if (!query) throw new Error("Supply a nonempty search query.");
    const terms = query.split(/\s+/);
    const matches = registrations
      .filter((record) => {
        const text = [record.name, record.title, record.description]
          .join(" ")
          .toLowerCase();
        return terms.every((term) => text.includes(term));
      })
      .map(({ root, ...record }) => record);
    return runTools(
      [{ type: "tool", name: "search-records", settings }],
      async () => ({ return_type: "results",
        status: "complete",
        settings,
        response: {
          response_type: "list",
          paths: matches,
          summary: { count: matches.length, total: registrations.length },
        },
      }),
      options,
    );
  }

  if (!Number.isSafeInteger(settings.id) || settings.id! <= 0)
    throw new Error("Supply a positive numeric tool id.");
  let registration: ToolRegistration | undefined;
  const loaded: RunProps = {
    type: "tool" as const,
    name: "tool-loader",
    settings,
  };
  const content = settings.content;
  if (content !== undefined && typeof content !== "string")
    throw new Error("content must be a JSON object string.");
  let executionSettings: Record<string, unknown> | undefined;
  if (content !== undefined) {
    try {
      const parsed: unknown = JSON.parse(content);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        throw new Error();
      executionSettings = parsed as Record<string, unknown>;
    } catch {
      throw new Error("content must contain a JSON object of tool settings.");
    }
  }
  const loading = await runTools(
    [loaded],
    async (step) => {
      const found = registrations.find((record) => record.id === settings.id);
      const returned: ToolReturn = found
        ? await withSkill({ return_type: "results",
            status: "complete",
            settings: step.settings,
            response: { paths: [found] },
          })
        : { return_type: "results",
            status: "error",
            settings: step.settings,
            error: `Tool ID ${settings.id} is not in rab_world.toolkits.`,
          };
      if (returned.status === "complete")
        registration = returned.response?.paths?.[0] as
          | ToolRegistration
          | undefined;
      return returned;
    },
    executionSettings
      ? { update: options.update, record: options.record }
      : options,
  );
  if (!executionSettings) return loading;
  const executionOptions: RunnerCallbacks = {
    record: options.record,
    update: (steps) => options.update?.([...loading, ...steps]),
    next: options.next
      ? (steps) => options.next!([...loading, ...steps])
      : undefined,
    complete: options.complete
      ? (steps) => options.complete!([...loading, ...steps])
      : undefined,
  };
  let execution: RunnerReturn;
  if (registration?.type === "runner") {
    try {
      const projectRoot = registration.root;
      const folder = await realpath(resolve(projectRoot, registration.path));
      const entry = await realpath(resolve(folder, registration.file));
      if (!isWithin(projectRoot, folder) || !isWithin(folder, entry))
        throw new Error("Runner entry escapes its registered folder.");
      if (
        ![".ts", ".js", ".mjs"].some((extension) => entry.endsWith(extension))
      )
        throw new Error(
          "Runner entry must be a JavaScript or TypeScript module.",
        );
      if (entry === fileURLToPath(import.meta.url))
        throw new Error("The dispatcher cannot recursively execute itself.");
      const imported = (await import(pathToFileURL(entry).href)) as {
        run?: (
          props: RunnersProps,
          options: RunnerCallbacks,
        ) => Promise<RunnerReturn>;
      };
      if (typeof imported.run !== "function")
        throw new Error("Runner entry does not export run.");
      // Delegate tracking to the selected runner. Never wrap its run in another tracked step.
      execution = await imported.run(executionSettings, executionOptions);
      if (Array.isArray(execution)) execution = execution.map(step => ({
        ...step,
        return_type: step.return_type ?? (step.name?.startsWith("new-") ? "scaffold" : "results"),
      }));
      if (
        !Array.isArray(execution) ||
        !execution.every(
          (step) =>
            ["complete", "error"].includes(step.status) &&
            typeof step.return_type === "string" &&
            Number.isFinite(step.date_start) &&
            Number.isFinite(step.date_end),
        )
      )
        throw new Error("Runner returned an invalid RunnerReturn.");
    } catch (error) {
      execution = await runTools(
        [
          {
            type: "tool" as const,
            name: registration.name,
            settings: executionSettings,
          },
        ],
        async (step) => ({ return_type: "results",
          status: "error",
          settings: step.settings,
          error: error instanceof Error ? error.message : String(error),
        }),
        executionOptions,
      );
    }
  } else {
    execution = await runTools(
      [
        {
          type: "tool" as const,
          name: "execute-tool",
          settings: executionSettings,
        },
      ],
      async (step) => {
        if (!registration)
          return { return_type: "results",
            status: "error",
            settings: step.settings,
            error: "Execution skipped because tool loading failed.",
          };
        return executeRegisteredTool(
          registration,
          step.settings as Record<string, unknown>,
        );
      },
      executionOptions,
    );
  }
  return [...loading, ...execution];
};

export async function executeToolById(id: number, settings: Record<string, unknown>, toolkits: {path: string}[]): Promise<ToolReturn> {
  const records = await indexedRegistrations(toolkits, id);
  const record = records.find(record => record.id === id);
  if (!record) throw new Error(`Unregistered tool ID ${id}`);
  return executeRegisteredTool(record, settings);
}
