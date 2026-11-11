import type {
  NewReactNavigationProps,
  NewReactNavigationRecord,
} from "./new-react-navigation.types.ts";
import {
  gridAttribute,
  publish,
  record,
  slug,
  template,
  validate,
} from "./scaffold.ts";
export async function newReactNavigation(
  input: NewReactNavigationProps,
): Promise<NewReactNavigationRecord> {
  input = validate(input);
  if (!Array.isArray(input.rows) || input.rows.length === 0)
    throw new Error("rows must be a nonempty array");
  const ids = new Set<string>(),
    paths = new Set<string>();
  for (const row of input.rows) {
    if (
      !row ||
      !["string", "number"].includes(typeof row.id) ||
      !String(row.id).trim() ||
      typeof row.name !== "string" ||
      !row.name.trim() ||
      typeof row.path !== "string" ||
      /[\x00-\x20\\]/.test(row.path) ||
      row.path.startsWith("//") ||
      !/^(https?:\/\/|[/?#]|\.{1,2}\/)/i.test(row.path)
    )
      throw new Error("Invalid navigation row");
    if (ids.has(String(row.id)) || paths.has(row.path))
      throw new Error("Duplicate navigation ID or path");
    ids.add(String(row.id));
    paths.add(row.path);
  }
  const values = {
    COMPONENT_NAME: input.name,
    COMPONENT_CLASS: slug(input.name),
    DEFAULT_CHILDREN: "null",
    GRID_ATTRIBUTE: await gridAttribute(input.grid),
    DEFAULT_CLASS: JSON.stringify(input.class_name ?? ""),
    NAV_ROWS: JSON.stringify(input.rows),
    NAV_LABEL: JSON.stringify(input.label ?? "Main navigation"),
    NAV_CLASS: slug(input.name),
  };
  const filename = `${input.name}${input.save_as_text ? ".txt" : ".tsx"}`;
  const text = await template("tmpl.tsx", values);
  const saved = record(input, "navigation") as NewReactNavigationRecord;
  Object.assign(saved, { file: filename });
  return publish(input.path, input.name, saved, [{ path: filename, text }]);
}
export const run = newReactNavigation;
