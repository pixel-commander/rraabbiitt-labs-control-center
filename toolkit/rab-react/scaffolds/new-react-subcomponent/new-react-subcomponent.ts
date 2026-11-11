import { access } from "node:fs/promises";
import path from "node:path";
import type {
  NewReactSubcomponentProps,
  NewReactSubcomponentRecord,
} from "./new-react-subcomponent.types.ts";
import {
  gridAttribute,
  publish,
  record,
  render,
  slug,
  template,
  tree,
  validate,
} from "./scaffold.ts";
export async function newReactSubcomponent(
  input: NewReactSubcomponentProps,
): Promise<NewReactSubcomponentRecord> {
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
        throw new Error("No HouseKeys.types.ts found above subcomponent destination.");
      typesRoot = parent;
    }
  }
  const values = {
    HOUSE_KEYS_IMPORT: JSON.stringify(
      path.relative(
        path.join(input.path, input.name),
        path.join(typesRoot, "HouseKeys.types"),
      ).replaceAll("\\", "/"),
    ),
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
  const files = [
    { path: filename, text: await template("tmpl.tsx", values) },
    {
      path: `${input.name}.types.ts`,
      text: await template("__COMPONENT_NAME__.types.ts", values),
    },
  ];
  for (const item of await tree("css", values))
    files.push({ ...item, path: `css/${render(item.path, values)}` });
  const saved = record(input, "component") as NewReactSubcomponentRecord;
  Object.assign(saved, { file: `${input.name}.tsx` });
  return publish(input.path, input.name, saved, files, ["css"]);
}
export const run = newReactSubcomponent;
