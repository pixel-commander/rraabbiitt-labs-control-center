import type {
  NewGridAtomProps,
  NewGridAtomRecord,
} from "./new-grid-atom.types.ts";
import { publish, record, tree, validate } from "./scaffold.ts";
export async function newGridAtom(
  input: NewGridAtomProps,
): Promise<NewGridAtomRecord> {
  validate(input, "kebab");
  if ("preset" in input)
    throw new Error("Use grid to select the grid template");
  const preset = input.grid ?? "grid-dashboard";
  const allowed = [
    "grid-dashboard",
    "grid-dashboard-alt",
    "grid-test",
    "grid-test-1",
  ];
  if (!allowed.includes(preset)) throw new Error("Unknown atom preset");
  const artifacts = (await tree(`presets/${preset}`))
    .filter((item) => item.path !== "settings.json")
    .map((item) => ({
      path: item.path.replaceAll(preset, input.name),
      text: item.text.replaceAll(preset, input.name),
    }));
  const saved = { ...record(input, "grids") } as NewGridAtomRecord;
  Object.assign(saved, { file: `${input.name}.css` });
  return publish(input.path, input.name, saved, artifacts);
}
export const run = newGridAtom;
