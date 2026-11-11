import type { ToolReturn } from "../../Tooling.types.ts";
import type {
  RunProps,
  RunnerCallbacks,
  RunnerReturn,
} from "../../Runner.types.ts";
import { runnerWorldTooling } from "../../runners/runner-world-tooling/runner-world-tooling.ts";

/** Prepare a tool plan and delegate all execution and tracking to the shared owner. */
export async function runTools(
  plan: RunProps[] | (() => Promise<RunProps[]>),
  execute: (run: RunProps) => ToolReturn | Promise<ToolReturn>,
  options: RunnerCallbacks = {},
): Promise<RunnerReturn> {
  const runs = typeof plan === "function" ? await plan() : plan;
  return runnerWorldTooling({ runs }, { ...options, execute });
}
