import { access } from "node:fs/promises";
import path from "node:path";
import type {
  NewReactComponentProps,
  NewReactComponentRecord,
} from "./new-react-component.types.ts";
import {
  folder,
  gridAttribute,
  publish,
  record,
  render,
  slug,
  template,
  tree,
  validate,
} from "./scaffold.ts";

export async function newReactComponent(
  input: NewReactComponentProps,
): Promise<NewReactComponentRecord> {
  input = validate(input);
  let typesRoot = input.path;
  while (true) {
    try {
      await access(path.join(typesRoot, "HouseKeys.types.ts"));
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const parent = path.dirname(typesRoot);
      if (parent === typesRoot)
        throw new Error(
          "No HouseKeys.types.ts found above component destination.",
        );
      typesRoot = parent;
    }
  }
  const values = {
    COMPONENT_NAME: input.name,
    COMPONENT_CLASS: slug(input.name),
    DEFAULT_CHILDREN: "null",
    GRID_ATTRIBUTE: await gridAttribute(input.grid),
    ROOT_CLASS: JSON.stringify(
      [slug(input.name), input.class_name].filter(Boolean).join(" "),
    ).slice(1, -1).replace(/[`$]/g, "\\$&"),
    NAV_ROWS: "[]",
    NAV_LABEL: JSON.stringify("Main navigation"),
    NAV_CLASS: slug(input.name),
  };
  const filename = `${input.name}${input.save_as_text ? ".txt" : ".tsx"}`;
  const files = [{ path: filename, text: await template("tmpl.tsx", values) }];
  const extra = {
    FILE_NAME: input.name,
    FILE_SLUG: slug(input.name),
    HOUSE_KEYS_IMPORT: JSON.stringify(
      path
        .relative(
          path.join(input.path, input.name),
          path.join(typesRoot, "HouseKeys.types"),
        )
        .replaceAll("\\", "/"),
    ),
  };
  files.push({
    path: `${input.name}.types.ts`,
    text: await template("__FILE_NAME__.types.ts", extra),
  });
  for (const dir of ["css", "hooks", "demo"])
    for (const item of await tree(dir, extra))
      files.push({
        ...item,
        path:
          dir === "hooks"
            ? `hooks/use${input.name}/${render(item.path, extra)}`
            : `${dir}/${render(item.path, extra)}`,
      });
  const saved = record(input, "component") as NewReactComponentRecord;
  Object.assign(saved, { file: filename });
  const hookName = `use${input.name}`;
  const hook = record({ name: hookName }, "hook", { file: `${hookName}.ts` });
  for (const [prefix, metadata] of [
    ["", saved],
    [`hooks/${hookName}/`, hook],
  ] as const) {
    files.push({
      path: `${prefix}README.txt`,
      text: `${metadata.name}\n\nGenerated starter. Update this document with the implemented contract.\n`,
    });
    files.push({
      path: `${prefix}use.skill.yaml`,
      text: `schema: 1\nintent: use\nid: ${record({ name: metadata.name }, "skill").id}\nname: ${metadata.name}\nowner:\n  id: ${metadata.id}\nimplementation:\n  - id: ${metadata.id}\ninstructions: Generated starter; update with the implemented contract before use.\n`,
    });
  }
  files.push({
    path: `hooks/${hookName}/rab.settings.json`,
    text: JSON.stringify(hook, null, 2),
  });
  return publish(input.path, input.name, saved, files, [
    "js",
    "css",
    "hooks",
    "demo",
  ]);
}
export const run = async (settings: NewReactComponentProps) => {
  try {
    return { return_type: "scaffold", status: "complete", settings, response: await newReactComponent(settings) };
  } catch (error) {
    return { return_type: "scaffold", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
};
