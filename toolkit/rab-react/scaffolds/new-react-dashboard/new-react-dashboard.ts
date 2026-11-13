import type {
  NewReactDashboardProps,
  NewReactDashboardRecord,
} from "./new-react-dashboard.types.ts";
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
export async function newReactDashboard(
  input: NewReactDashboardProps,
): Promise<NewReactDashboardRecord> {
  input = validate(input);
  const legacy = input as unknown as Record<string, unknown>;
  if (
    legacy.page_location !== undefined ||
    legacy.component_location !== undefined
  )
    throw new Error("Use path for the self-contained dashboard destination.");
  const layout = input.layout ?? "header-main";
  if (layout !== "header-main")
    throw new Error("Dashboard template currently supports header-main");
  await gridAttribute(layout);
  const values = {
    FILE_NAME: input.name,
    FILE_SLUG: slug(input.name),
    TITLE: JSON.stringify(input.title ?? input.name),
    CONTENT: JSON.stringify(input.content ?? ""),
  };
  const artifacts = [
    { path: `${input.name}.tsx`, text: await template("tmpl.tsx", values) },
  ];
  for (const sub of ["css", "hooks"])
    for (const item of await tree(sub, values))
      artifacts.push({ ...item, path: `${sub}/${render(item.path, values)}` });
  const saved = record(input, "dashboard") as NewReactDashboardRecord;
  Object.assign(saved, { file: `${input.name}.tsx` });
  return publish(input.path, input.name, saved, artifacts, [
    "css",
    "hooks",
    "js",
    "pages",
  ]);
}
export const run = async (settings: NewReactDashboardProps) => {
  try {
    return { return_type: "scaffold", status: "complete", settings, response: await newReactDashboard(settings) };
  } catch (error) {
    return { return_type: "scaffold", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
};
