import { readFile } from "node:fs/promises";
import { resolve, relative, join } from "node:path";
import type { ToolsProps, ToolReturn } from "../../Tooling.types.ts";
import type { RunnerCallbacks, RunProps } from "../../Runner.types.ts";
import { runTools } from "../../runners/run-tools.ts";

const kinds = ["container", "action", "effect", "grid"];
const locations: Record<string, string> = {
  component: "components",
  subcomponent: "components",
  page: "pages",
  dashboard: "dashboards",
  project: "projects",
};

/** Execute a canonical scaffold without starting another tracking layer. */
export async function executeReactScaffold(
  scaffold: string,
  settings: ToolsProps,
): Promise<ToolReturn> {
  const allowed = [
    "new-react-component",
    "new-react-subcomponent",
    "new-react-page",
    "new-react-dashboard",
    "new-react-project",
    "new-react-navigation",
    ...kinds.map((kind) => `new-${kind}-atom`),
  ];
  if (!allowed.includes(scaffold)) throw new Error("Unknown React scaffold.");
  const tool = await import(`../scaffolds/${scaffold}/${scaffold}.ts`);
  const created = await tool.run(settings);
  return {
    status: "complete",
    settings,
    response: { ...created, summary: { count: created.paths?.length ?? 0 } },
  };
}

export const planReactScaffold = async (kind: string, input: ToolsProps): Promise<RunProps[]> => {
  let root: string;
  let destination: string;
  let scaffold: string;
  if (
    input.path === undefined ||
    input.path === null ||
    input.path === "" ||
    input.name === undefined ||
    input.name === null ||
    input.name === ""
  )
    throw new Error("Supply path and name.");
  root = input.path ? resolve(input.path) : "";
  let project;
  try {
    project = root
      ? JSON.parse(await readFile(join(root, "rab.project.json"), "utf8"))
      : { paths: [] };
  } catch (error) {
    if (
      kind !== "project" ||
      (error as NodeJS.ErrnoException).code !== "ENOENT"
    )
      throw error;
    project = { paths: [] };
  }
  const category = kind === "atom" ? `${input.type}s` : locations[kind];
  const registeredPaths = Array.isArray(input.paths)
    ? input.paths
    : (project.paths ?? []);
  const registered = registeredPaths.find(
    (entry: ToolsProps) =>
      entry.type === "path" &&
      (entry.name === (kind === "atom" ? input.type : category) ||
        entry.name === `${category} folder` ||
        entry.tags?.includes(category)),
  )?.path;
  const chosen =
    input.save_path ?? registered ?? (kind === "project" ? "." : undefined);
  destination =
    root && typeof chosen === "string"
      ? resolve(root, chosen.replaceAll("\\", "/"))
      : "";
  scaffold =
    kind === "atom" ? `new-${input.type}-atom` : `new-react-${kind}`;
  return [
    {
      type: "tool" as const,
      name: scaffold,
      settings: { ...input, path: destination },
    },
  ];

};

export const executePlannedReactScaffold = async (kind: string, input: ToolsProps, run: RunProps): Promise<ToolReturn> => {
  const root = resolve(String(input.path));
  const returned = await executeReactScaffold(String(run.name), run.settings);
  if (returned.status !== "complete" || !returned.response) return returned;
  const created = returned.response!;
  // Project files are stored relative to the new project; return locations relative to the caller.
  const prefix =
    kind === "project"
      ? relative(root, String(created.path)).replaceAll("\\", "/")
      : "";
  const path = prefix || created.path;
  const paths = prefix
    ? created.paths?.map((item) => ({
        ...item,
        path: [prefix, item.path === "." ? "" : item.path]
          .filter(Boolean)
          .join("/"),
      }))
    : created.paths;
  return { ...returned, response: { ...created, path, paths } };
};

export const runReactScaffold = (kind: string, input: ToolsProps, options: RunnerCallbacks = {}) => {
  return runTools(
    () => planReactScaffold(kind, input),
    (run) => executePlannedReactScaffold(kind, input, run),
    options,
  );
};
