import type {
  NewReactPageProps,
  NewReactPageRecord,
} from "./new-react-page.types.ts";
import { publish, record, render, slug, tree, validate } from "./scaffold.ts";
export async function newReactPage(
  input: NewReactPageProps,
): Promise<NewReactPageRecord> {
  input = validate(input);
  const pageName = input.name.endsWith("Page")
    ? input.name
    : `${input.name}Page`;
  const values = {
    FILE_NAME: input.name,
    FILE_SLUG: slug(input.name),
    PAGE_NAME: pageName,
    PAGE_SLUG: slug(input.name),
    PAGE_TITLE: JSON.stringify(input.title ?? input.name),
    PAGE_DESCRIPTION: JSON.stringify(input.description ?? ""),
    PAGE_CONTENT: JSON.stringify(input.content ?? ""),
  };
  const filename = `${pageName}${input.save_as_text ? ".txt" : ".tsx"}`;
  const files = (await tree(".", values))
    .filter((item) => !item.path.endsWith(".gitkeep"))
    .map((item) => ({
      ...item,
      path: item.path === "tmpl.tsx" ? filename : render(item.path, values),
    }));
  const saved = record(input, "page") as NewReactPageRecord;
  Object.assign(saved, { file: filename });
  return publish(input.path, input.name, saved, files, [
    "css",
    "hooks",
    "js",
    "views",
  ]);
}
export const run = newReactPage;
