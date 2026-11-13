import { readFile, mkdir, writeFile, rename, unlink } from "node:fs/promises";
import { resolve, join, relative, isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const runnerId = 1794366620615;
const required = ["name", "title", "path", "type", "description"];

export async function saveComponent(data, toolkitRoot, projectRoot) {
  for (const key of required) {
    if (typeof data?.[key] !== "string" || !data[key].trim()) throw Error(`${key} is required.`);
  }
  if (data.type !== "component") throw Error("This save type creates components.");
  if (!data.composition || !Array.isArray(data.composition.elements)) throw Error("Composition is required.");
  if (typeof projectRoot !== "string" || !projectRoot.trim()) throw Error("projectRoot is required.");
  projectRoot = resolve(projectRoot);
  const destination = resolve(projectRoot, data.path);
  const local = relative(projectRoot, destination);
  if (local.split(/[\\/]/)[0] === ".." || isAbsolute(local)) {
    throw Error("Component destination must be inside the configured project.");
  }
  if (typeof data.code !== "string" || typeof data.css !== "string") throw Error("Generated code and css are required.");
  const { resolveRunner } = await import(pathToFileURL(resolve(toolkitRoot, "rab-react/runners/resolve-runner.ts")).href);
  const entry = await resolveRunner(runnerId, projectRoot);
  const { run, pascalCase } = await import(pathToFileURL(entry).href);

  const storage = destination;
  const name = pascalCase(data.name);
  const file = join(storage, name, "composition.json");
  if (data.id !== undefined && !Number.isSafeInteger(data.id)) throw Error("Saved component identity is invalid.");
  try {
    const previous = JSON.parse(await readFile(file, "utf8"));
    if (resolve(projectRoot, previous.path) !== destination || (data.id !== undefined && previous.id !== data.id)) {
      throw Error("This composition name belongs to another component or project.");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const results = await run({
    id: data.id,
    name: data.name.trim(),
    title: data.title.trim(),
    description: data.description.trim(),
    type: data.type,
    path: projectRoot,
    save_path: destination,
    catalog: false,
    code: data.code,
    css: data.css,
    overwrite: data.overwrite === true,
  });
  const confirmation = results.find((item) => item.response?.type === "overwrite-confirmation");
  if (confirmation) {
    return {
      requires_confirmation: true,
      id: confirmation.response.id,
      name: confirmation.response.name,
      path: destination,
      results,
    };
  }
  const result = results.findLast((item) => item.response?.id);
  if (!result || results.some((item) => item.status !== "complete")) {
    throw Error(results.find((item) => item.error)?.error || "Factory composition runner failed.");
  }
  const created = result.response;
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(created.name)) throw Error("Runner returned an invalid component name.");
  const folder = join(storage, created.name);
  await mkdir(folder, { recursive: true });
  const saved = {
    ...data.composition,
    id: created.id,
    name: created.name,
    title: data.title.trim(),
    path: destination,
    type: "component",
    description: data.description.trim(),
  };
  const temp = join(folder, `.${randomUUID()}.tmp`);
  try {
    await writeFile(temp, JSON.stringify(saved, null, 2) + "\n", { flag: "wx" });
    await rename(temp, file);
  } catch (error) {
    await unlink(temp).catch(() => {});
    throw Error(`Component ${created.name} exists, but composition could not be saved: ${error.message}`);
  }
  return {
    id: created.id,
    name: created.name,
    title: saved.title,
    description: saved.description,
    path: destination,
    save_path: created.path,
    paths: created.paths,
    file,
    results,
  };
}

export const factorySavePlugin = ({ path, toolkitRoot, projectRoot }) => {
  if (typeof path !== "string" || !path.trim()) throw Error("Factory components path is required.");
  if (typeof toolkitRoot !== "string" || !toolkitRoot.trim()) throw Error("Factory toolkitRoot is required.");
  if (typeof projectRoot !== "string" || !projectRoot.trim()) throw Error("Factory projectRoot is required.");
  const destination = resolve(projectRoot, path);
  let pending = false;
  const install = (server) => {
    server.middlewares.use("/api/factory/save", async (req, res) => {
      const send = (status, value) => {
        res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
        res.end(JSON.stringify(value));
      };
      if (req.method === "GET") return send(200, { path: destination });
      if (req.method !== "POST") return send(405, { error: "Use GET or POST." });
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return send(403, { error: "Same-origin request required." });
      if (pending) return send(409, { error: "A component save is already running." });
      pending = true;
      try {
        let body = "";
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 2000000) throw Error("Save request exceeds 2 MB.");
          body += chunk;
        }
        const data = JSON.parse(body);
        if (data.save_type !== "component-runner") throw Error("Unknown save type.");
        send(200, await saveComponent(data, toolkitRoot, projectRoot));
      } catch (error) {
        send(400, { error: error instanceof Error ? error.message : String(error) });
      } finally {
        pending = false;
      }
    });
  };
  return { name: "factory-save", configureServer: install, configurePreviewServer: install };
};
