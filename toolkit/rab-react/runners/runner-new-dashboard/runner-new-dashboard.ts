import type { ToolsProps } from "../../../Tooling.types.ts";
import type { RunnerCallbacks } from "../../../Runner.types.ts";
import { runReactScaffold } from "../run-react-scaffold.ts";
export const run = (settings: ToolsProps, options?: RunnerCallbacks) =>
  runReactScaffold("dashboard", settings, options);
