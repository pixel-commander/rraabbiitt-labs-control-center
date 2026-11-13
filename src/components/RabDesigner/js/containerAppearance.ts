export const containerGroups = {
  Background: [
    "background",
    "background-color",
    "background-image",
    "background-size",
    "background-position",
    "background-repeat",
    "background-blend-mode",
  ],
  Border: [
    "border",
    "border-width",
    "border-style",
    "border-color",
    "border-top",
    "border-right",
    "border-bottom",
    "border-left",
    "border-radius",
    "border-top-left-radius",
    "border-top-right-radius",
    "border-bottom-right-radius",
    "border-bottom-left-radius",
  ],
  Content: ["color"],
} as const;
export const containerProperties = Object.values(containerGroups).flat();
export function containerAppearance(
  selector: string,
  entries: [string, string][],
) {
  const values = entries.filter(([key]) =>
    (containerProperties as readonly string[]).includes(key),
  );
  return values.length
    ? `${selector}{${values.map(([key, value]) => `${key}:${value}`).join(";")}}`
    : "";
}
