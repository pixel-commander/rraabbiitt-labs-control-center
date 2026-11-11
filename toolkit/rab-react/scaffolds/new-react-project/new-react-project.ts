import { join } from "node:path";
import type {
  NewReactProjectProps,
  NewReactProjectRecord,
} from "./new-react-project.types.ts";
import { publish, record, render, tree, validate } from "./scaffold.ts";
export async function newReactProject(
  input: NewReactProjectProps,
): Promise<NewReactProjectRecord> {
  if (typeof input.name !== "string" || !input.name.trim())
    throw new Error("Supply a project name.");
  let folderName = input.name
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  if (!folderName)
    throw new Error("Supply a project name containing letters or numbers.");
  if (/^[0-9]/.test(folderName)) folderName = `project-${folderName}`;

  validate({ ...input, name: folderName }, "kebab");
  const legacy = input as unknown as Record<string, unknown>;
  if (legacy.add_ui_kit || legacy.custom_toolkit_path)
    throw new Error(
      "Legacy UI-kit options are retired; the project template includes its local styles.",
    );
  if (legacy.ensure_atoms || legacy.atom_decisions)
    throw new Error(
      "Automatic atom provisioning is retired; create atoms with the local atom scaffolds.",
    );
  const saved = record(input, "project") as NewReactProjectRecord;
  let previousId = saved.id;
  const homeId = (previousId = Math.max(Date.now(), previousId + 1));
  const styleGuideId = (previousId = Math.max(Date.now(), previousId + 1));
  const values = {
    HOME_VIEW_ID: String(homeId),
    STYLE_GUIDE_VIEW_ID: String(styleGuideId),
    PROJECT_NAME: "__PROJECT_DISPLAY_NAME__",
    PROJECT_TITLE_JSON: JSON.stringify(input.title ?? input.name),
    NPM_NAME: folderName,
    PROJECT_ID: String(saved.id),
  };
  const excluded = new Set([
    "settings.json",
    "rab.settings.json",
    "rab.project.json",
    "PATHS.json",
  ]);
  const files = (await tree(".", values))
    .filter((item) => !excluded.has(item.path))
    .map((item) => ({
      ...item,
      path: render(item.path, values),
      text: item.text.replaceAll(
        "__PROJECT_DISPLAY_NAME__",
        item.path.endsWith(".json")
          ? JSON.stringify(input.name).slice(1, -1)
          : input.name
              .replaceAll("&", "&amp;")
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;"),
      ),
    }));
  for (const item of files)
    if (item.path.endsWith("/rab.settings.json")) {
      const nested = JSON.parse(item.text) as Record<string, unknown>;
      if (nested.type === "path") continue;
      nested.id =
        item.path === "src/pages/home/rab.settings.json"
          ? homeId
          : item.path === "src/pages/StyleGuide/rab.settings.json"
            ? styleGuideId
            : (previousId = Math.max(Date.now(), previousId + 1));
      delete nested.path; // The saved path is filled from the generated destination.
      item.text = `${JSON.stringify(nested, null, 2)}\n`;
    }
  saved.paths = files
    .filter((item) => item.path.endsWith("/rab.settings.json"))
    .map((item) => JSON.parse(item.text))
    .filter((nested) => nested.type === "path");
  const created = await publish(input.path, folderName, saved, files);
  return { ...created, path: join(input.path, folderName) };
}
export const run = newReactProject;
