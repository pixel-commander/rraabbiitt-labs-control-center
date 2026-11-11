import type {
  NewActionAtomProps,
  NewActionAtomRecord,
} from "./new-action-atom.types.ts";
import { publish, record, tree, validate } from "./scaffold.ts";
export async function newActionAtom(
  input: NewActionAtomProps,
): Promise<NewActionAtomRecord> {
  validate(input, "kebab");
  const suffix = input.name.replace(/^(?:action-)+/, "");
  if (!suffix || suffix === "action")
    throw new Error("Provide an atom name after action-");
  if (
    input.name_prefix &&
    !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(input.name_prefix)
  )
    throw new Error("name_prefix must be kebab-case");
  const name = `${input.name_prefix ? `${input.name_prefix}-` : ""}action-${suffix}`;
  if (/[{}]/.test(input.styles ?? ""))
    throw new Error("styles accepts declarations only");
  const files = await tree(".", {
    ATOM_NAME: name,
    ATOM_STYLES: input.styles ?? "",
  });
  const artifacts = files.map((item) => ({
    ...item,
    path: item.path.replaceAll("__ATOM_NAME__", name),
  }));
  const saved = {
    ...record({ ...input, name }, "actions"),
    name,
  } as NewActionAtomRecord;
  Object.assign(saved, { file: `${name}.css` });
  return publish(input.path, name, saved, artifacts);
}
export const run = newActionAtom;
