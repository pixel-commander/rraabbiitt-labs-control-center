import {
  readFile,
  realpath,
  readdir,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { randomUUID } from "node:crypto";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import type {
  RunnerCallbacks,
  RunnerReturn,
  RunProps,
} from "../../Runner.types.ts";
import type {
  RefreshWorldJsonProps,
  RefreshWorldJsonType,
} from "./runner-refresh-world-json.types.ts";
import { runTools } from "../run-tools.ts";
import { run as refreshProject } from "../../tools/refresh-project-json/refresh-project-json.ts";
import { run as refreshBeacon } from "../../tools/refresh-beacon-json/refresh-beacon-json.ts";
import { run as refreshSettings } from "../../tools/refresh-settings-json/refresh-settings-json.ts";

const inside = (root: string, path: string) => {
  const child = relative(root, path);
  return child !== ".." && !child.startsWith(`..${sep}`) && !isAbsolute(child);
};
const readObject = async (file: string): Promise<Record<string, unknown>> => {
  const record: unknown = JSON.parse(await readFile(file, "utf8"));
  if (!record || typeof record !== "object" || Array.isArray(record))
    throw new Error(`Expected a JSON object: ${file}`);
  return record as Record<string, unknown>;
};

const updateWorldJson = async (
  worldFile: string,
  root: string,
  projectFolders: string[],
) => {
  const world = await readObject(worldFile);
  const oldPaths = Array.isArray(world.paths) ? world.paths : [];
  const oldProjectNames = new Map<number, string>();
  for (const entry of oldPaths) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const old = entry as Record<string, unknown>;
    if (
      old.type === "project" &&
      typeof old.id === "number" &&
      typeof old.name === "string"
    )
      oldProjectNames.set(old.id, old.name);
  }
  const projects: Record<string, unknown>[] = [];
  for (const folder of projectFolders) {
    const project = await readObject(join(folder, "rab.project.json"));
    if (
      typeof project.id !== "number" ||
      !Number.isSafeInteger(project.id)
    )
      throw new Error(`Project requires a valid numeric id: ${folder}`);
    projects.push({
      id: project.id,
      name:
        typeof project.name === "string"
          ? project.name
          : oldProjectNames.get(project.id) ?? basename(folder),
      type: "project",
      path: resolve(folder).replaceAll("\\", "/"),
      file: "rab.project.json",
    });
  }
  const keyedProjects = new Map<number, Record<string, unknown>>(
    projects.map((project) => [project.id as number, project]),
  );
  const orderedProjects: Record<string, unknown>[] = [];
  for (const entry of oldPaths) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const old = entry as Record<string, unknown>;
    if (old.type !== "project") continue;
    const match =
      typeof old.id === "number" ? keyedProjects.get(old.id) : undefined;
    if (match) {
      orderedProjects.push(match);
      keyedProjects.delete(old.id as number);
    }
  }
  const updated = {
    ...world,
    path: resolve(root).replaceAll("\\", "/"),
    paths: [
      ...oldPaths.filter(
        (entry) =>
          !entry ||
          typeof entry !== "object" ||
          Array.isArray(entry) ||
          (entry as Record<string, unknown>).type !== "project",
      ),
      ...orderedProjects,
      ...keyedProjects.values(),
    ],
  };
  const temporary = `${worldFile}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(updated, null, 2)}\n`, {
      flag: "wx",
    });
    await rename(temporary, worldFile);
  } finally {
    await unlink(temporary).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
  return { count: projects.length };
};

export const run = async (
  props: RefreshWorldJsonProps,
  options: RunnerCallbacks = {},
): Promise<RunnerReturn> => {
  const settings = { ...props };
  const failed: string[] = [];
  let worldFile: string | undefined;
  let worldRoot: string | undefined;
  let worldProjects: string[] = [];
  const step = (
    type: RefreshWorldJsonType,
    path: string,
    root?: string,
  ): RunProps => ({
    type: "tool",
    name: `refresh-${type}-json`,
    settings: { ...settings, type, path, ...(root ? { root } : {}) },
  });
  return runTools(
    async () => {
      if (
        !["world", "project", "beacon", "settings"].includes(
          String(settings.type),
        )
      )
        throw new Error("Supply type: world, project, beacon or settings.");
      if (typeof settings.path !== "string" || !settings.path.trim())
        throw new Error("Supply path; ID lookup is not implemented yet.");
      if (settings.type === "beacon" || settings.type === "settings")
        return [step(settings.type, settings.path)];
      const supplied = resolve(settings.path);
      const info = await stat(supplied);
      const filename =
        settings.type === "world" ? "rab.world.json" : "rab.project.json";
      if (
        !info.isDirectory() &&
        (!info.isFile() || basename(supplied) !== filename)
      )
        throw new Error(`Supply a folder or its ${filename} file.`);
      const root = await realpath(
        info.isDirectory() ? supplied : dirname(supplied),
      );
      if (settings.type === "world") {
        const candidate = info.isFile() ? supplied : join(root, filename);
        try {
          if ((await stat(candidate)).isFile()) {
            worldFile = candidate;
            worldRoot = root;
          }
        } catch (error) {
          const code = (error as NodeJS.ErrnoException).code;
          if (code !== "ENOENT" && code !== "ENOTDIR") throw error;
        }
      }
      if (settings.type === "project") {
        const record = JSON.parse(await readFile(join(root, filename), "utf8"));
        if (!record || typeof record !== "object" || Array.isArray(record))
          throw new Error("rab.project.json must contain a JSON object.");
      }
      const projects: string[] = [];
      const beacons: string[] = [];
      const discover = async (folder: string): Promise<void> => {
        const children = (await readdir(folder, { withFileTypes: true })).sort(
          (a, b) => a.name.localeCompare(b.name),
        );
        for (const child of children) {
          if (child.isSymbolicLink()) continue;
          if (child.isDirectory()) {
            if (
              !/^(template|templates|node_modules|dist|build|coverage|\.git|\.tmp)$/i.test(
                child.name,
              )
            )
              await discover(join(folder, child.name));
          } else if (child.isFile()) {
            if (child.name === "rab.project.json") projects.push(folder);
            if (child.name === "rab.beacon.json") beacons.push(folder);
          }
        }
      };
      await discover(root);
      projects.sort(
        (a, b) =>
          b.split(sep).length - a.split(sep).length || a.localeCompare(b),
      );
      worldProjects = [...projects];
      const beaconRuns = beacons.map((path) =>
        step(
          "beacon",
          path,
          projects.find((project) => inside(project, path)) ?? root,
        ),
      );
      return [
        ...(beaconRuns.length
          ? [
              {
                type: "runner" as const,
                name: "refresh-beacons",
                settings: { parallel: true, runs: beaconRuns },
              },
            ]
          : []),
        ...projects.map((path) => step("project", path)),
        ...(worldFile && worldRoot
          ? [
              {
                type: "tool" as const,
                name: "update-rab-world-json",
                settings: { ...settings, path: worldFile, root: worldRoot },
              },
            ]
          : []),
      ];
    },
    async (run) => {
      if (run.name === "refresh-settings-json")
        return refreshSettings(run.settings);
      if (run.name === "refresh-beacon-json") {
        const result = await refreshBeacon(run.settings);
        if (result.status !== "complete")
          failed.push(String(run.settings.path));
        return result;
      }
      const path = String(run.settings.path);
      if (run.name === "update-rab-world-json") {
        if (failed.length)
          return { return_type: "settings",
            status: "error",
            settings: run.settings,
            error:
              "World refresh skipped because one or more beacon or project refreshes failed.",
          };
        try {
          const summary = await updateWorldJson(
            path,
            String(run.settings.root),
            worldProjects,
          );
          return { return_type: "settings",
            status: "complete",
            settings: run.settings,
            response: { summary },
          };
        } catch (error) {
          return { return_type: "settings",
            status: "error",
            settings: run.settings,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }
      if (failed.some((child) => inside(path, child)))
        return { return_type: "settings",
          status: "error",
          settings: run.settings,
          error:
            "Project refresh skipped because a descendant beacon or project refresh failed.",
        };
      const result = await refreshProject(run.settings);
      if (result.status !== "complete") failed.push(path);
      return result;
    },
    options,
  );
};
