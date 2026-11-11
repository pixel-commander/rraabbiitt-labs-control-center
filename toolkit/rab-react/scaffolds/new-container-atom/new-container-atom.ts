import type {
  NewContainerAtomProps,
  NewContainerAtomRecord,
} from "./new-container-atom.types.ts";
import { publish, record, tree, validate } from "./scaffold.ts";
export async function newContainerAtom(
  input: NewContainerAtomProps,
): Promise<NewContainerAtomRecord> {
  validate(input, "kebab");
  const suffix = input.name.replace(/^(?:container-)+/, "");
  if (!suffix || suffix === "container")
    throw new Error("Provide an atom name after container-");
  if (
    input.name_prefix &&
    !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(input.name_prefix)
  )
    throw new Error("name_prefix must be kebab-case");
  const name = `${input.name_prefix ? `${input.name_prefix}-` : ""}container-${suffix}`;
  if (/[{}]/.test(input.styles ?? ""))
    throw new Error("styles accepts declarations only");
  const artifacts = (
    await tree(".", { ATOM_NAME: name, ATOM_STYLES: input.styles ?? "" })
  ).map((item) => ({
    ...item,
    path: item.path.replaceAll("__ATOM_NAME__", name),
  }));
  const saved = {
    ...record({ ...input, name }, "containers"),
    name,
  } as NewContainerAtomRecord;
  Object.assign(saved, { file: `${name}.css` });
  return publish(input.path, name, saved, artifacts);
}
export const run = newContainerAtom;
