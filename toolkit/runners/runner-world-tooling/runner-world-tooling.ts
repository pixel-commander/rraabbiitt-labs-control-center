import { resolve } from "node:path";
import type { Runner } from "../../Runner.types.ts";
import type {
  RunProps,
  RunResponse,
  RunnerSettings,
  RunnerOptions,
} from "../../Runner.types.ts";
import type { ToolReturn } from "../../Tooling.types.ts";


const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const identity = (run: RunProps) => {
  const { id, name, title, description, path, paths, type } = run;
  return {
    type,
    ...(id !== undefined ? { id } : {}),
    ...(name !== undefined ? { name } : {}),
    ...(title !== undefined ? { title } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(path !== undefined ? { path } : {}),
    ...(paths !== undefined ? { paths } : {}),
  };
};

/** One tracking owner walks nested plans and publishes one flat, preorder array. */
export async function runnerWorldTooling(
  settings: RunnerSettings,
  options: RunnerOptions,
): Promise<RunResponse[]> {
  if (!object(settings) || !Array.isArray(settings.runs))
    throw new TypeError("runs must be an array");
  if (typeof options?.execute !== "function")
    throw new TypeError("The host must supply execute");
  if (options.update !== undefined && typeof options.update !== "function")
    throw new TypeError("update must be a function");
  const validate = (runs: unknown[], ancestors = new Set<unknown>()) => {
    for (const run of runs) {
      if (
        !object(run) ||
        !["tool", "llm", "runner"].includes(String(run.type)) ||
        !object(run.settings)
      ) {
        throw new TypeError(
          "Each run requires type tool, llm or runner and a settings object",
        );
      }
      if (ancestors.has(run))
        throw new TypeError("Runner plans cannot contain cycles");
      if (run.type === "runner") {
        if (
          run.settings.parallel !== undefined &&
          typeof run.settings.parallel !== "boolean"
        )
          throw new TypeError("Runner settings.parallel must be boolean");
        if (!Array.isArray(run.settings.runs))
          throw new TypeError("Runner settings.runs must be an array");
        validate(run.settings.runs, new Set([...ancestors, run]));
      }
    }
  };
  validate(settings.runs);
  const responses: RunResponse[] = [];
  interface Entry {
    run: RunProps;
    index: number;
    children: Entry[];
  }
  const prepare = (runs: RunProps[]): Entry[] =>
    runs.map((run) => {
      const index = responses.length;
      // The nested plan is represented by flat child entries, not duplicated in settings.
      const input = { ...run.settings };
      if (run.type === "runner") delete input.runs;
      responses.push({ return_type: "results",
        ...identity(run),
        status: "waiting",
        settings: input,
      });
      return {
        run,
        index,
        children:
          run.type === "runner"
            ? prepare(run.settings.runs as RunProps[])
            : [],
      };
    });
  const entries = prepare(structuredClone(settings.runs));
  const publish = async () => {
    if (options.update) await options.update(structuredClone(responses));
  };
  const visit = async ({ run, index, children }: Entry): Promise<void> => {
    responses[index] = { ...responses[index], date_start: Date.now() };
    await publish();
    let returned: ToolReturn;
    if (run.type === "runner") {
      if (run.settings.parallel === true) {
        const settled = await Promise.allSettled(children.map(visit));
        const rejected = settled.find((result) => result.status === "rejected");
        if (rejected?.status === "rejected") throw rejected.reason;
      } else {
        for (const child of children) await visit(child);
      }
      const failed = children.filter(
        (child) => responses[child.index].status === "error",
      );
      const partial = children.some(
        (child) => responses[child.index].error !== undefined,
      );
      returned = { return_type: "summary",
        status: failed.length ? "error" : "complete",
        settings: responses[index].settings,
        ...(partial
          ? {
              error: failed.length
                ? `${failed.length} child steps failed`
                : "Completed with child errors",
            }
          : {}),
      };
    } else {
      try {
        returned = await options.execute(
          structuredClone(run),
          structuredClone(responses),
        );
        if (
          !object(returned) ||
          !["complete", "error"].includes(returned.status) ||
          !object(returned.settings)
        ) {
          throw new TypeError(
            "Execution must return status complete/error and settings",
          );
        }
        if (
          returned.status === "error" &&
          (typeof returned.error !== "string" || !returned.error.trim())
        )
          throw new TypeError("An error return requires an error message");
        if (
          returned.error !== undefined &&
          (typeof returned.error !== "string" || !returned.error.trim())
        )
          throw new TypeError("error must be a nonempty string when present");
        if (returned.response !== undefined && !object(returned.response))
          throw new TypeError("response must be an object");
        returned = structuredClone(returned);
      } catch (error) {
        returned = { return_type: "results",
          status: "error",
          settings: run.settings,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
    responses[index] = {
      ...responses[index],
      return_type: returned.return_type,
      status: returned.status,
      settings: returned.settings,
      ...(returned.response !== undefined
        ? { response: returned.response }
        : {}),
      ...(returned.error !== undefined ? { error: returned.error } : {}),
      date_end: Date.now(),
    };
    if (options.record && run.type !== "llm") {
      try {
        await options.record(structuredClone(responses[index]));
      } catch (error) {
        responses[index].error = [responses[index].error, error instanceof Error ? error.message : String(error)].filter(Boolean).join("\n");
      }
    }
    await publish();
  };
  await publish();
  for (const entry of entries) await visit(entry);
  while (options.next) {
    const next = await options.next(structuredClone(responses));
    if (!next) break;
    validate([next]);
    const [entry] = prepare([structuredClone(next)]);
    await publish();
    await visit(entry);
  }
  if (options.complete && responses.length) {
    try {
      await options.complete(structuredClone(responses));
    } catch (error) {
      console.warn(
        "Run could not be saved:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }
  return responses;
}

/** Registered entry resolves numeric tool IDs from this world's current registrations. */
export const run: Runner = async (props, options = {}) => {
  if (!Array.isArray(props.runs)) throw new TypeError("Supply runs as an array.");
  const { loadWorld } = await import("../../../scripts/world.mjs");
  const world = await loadWorld();
  const toolkits = world.toolkits.map((entry: { path: string }) => ({ ...entry, path: resolve(world.path, entry.path) }));
  const { executeToolById } = await import("../../runners/runner-use-tool/runner-use-tool.ts");
  return runnerWorldTooling({ runs: props.runs as RunProps[] }, { ...options,
    execute: async step => {
      if (!Number.isSafeInteger(step.id)) throw new TypeError("Each tool requires its numeric House ID.");
      return executeToolById(step.id!, step.settings, toolkits);
    } });
};
