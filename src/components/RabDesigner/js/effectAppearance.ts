export const effectProperties = [
  "box-shadow",
  "text-shadow",
  "opacity",
  "filter",
  "backdrop-filter",
  "mix-blend-mode",
  "transition",
] as const;
export function effectAppearance(
  selector: string,
  entries: [string, string][],
) {
  const values = entries.filter(([key]) =>
    (effectProperties as readonly string[]).includes(key),
  );
  return values.length
    ? `${selector}{${values.map(([key, value]) => `${key}:${value}`).join(";")}}`
    : "";
}
