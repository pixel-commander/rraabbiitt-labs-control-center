import type {
  NewEffectAtomProps,
  NewEffectAtomRecord,
} from "./new-effect-atom.types.ts";
import { publish, record, tree, validate } from "./scaffold.ts";
export async function newEffectAtom(
  input: NewEffectAtomProps,
): Promise<NewEffectAtomRecord> {
  validate(input, "kebab");
  const suffix = input.name.replace(/^(?:effect-)+/, "");
  if (!suffix || suffix === "effect")
    throw new Error("Provide an atom name after effect-");
  if (
    input.name_prefix &&
    !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(input.name_prefix)
  )
    throw new Error("name_prefix must be kebab-case");
  const name = `${input.name_prefix ? `${input.name_prefix}-` : ""}effect-${suffix}`;
  if (/[{}]/.test(input.styles ?? ""))
    throw new Error("styles accepts declarations only");
  const artifacts = (
    await tree(".", { ATOM_NAME: name, ATOM_STYLES: input.styles ?? "" })
  ).map((item) => ({
    ...item,
    path: item.path.replaceAll("__ATOM_NAME__", name),
  }));
  const saved = {
    ...record({ ...input, name }, "effects"),
    name,
  } as NewEffectAtomRecord;
  Object.assign(saved, { file: `${name}.css` });
  return publish(input.path, name, saved, artifacts);
}
export const run = newEffectAtom;
