import {
  containerGroups,
  containerAppearance,
} from "./containerAppearance.ts";
import {
  effectProperties,
  effectAppearance,
} from "./effectAppearance.ts";
export const appearanceGroups = {
  ...containerGroups,
  Effects: effectProperties,
};
export const appearanceProperties = Object.values(appearanceGroups).flat();
export const appearanceStates = [
  "normal",
  "hover",
  "active",
  "focus",
  "disabled",
] as const;
export type DesignerState = (typeof appearanceStates)[number];
export type DesignerAppearance = Partial<
  Record<
    DesignerState,
    Partial<Record<(typeof appearanceProperties)[number], string>>
  >
>;
export function validCSSValue(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 2000 &&
    !/[{};<>]|url\s*\(|@import|expression\s*\(/i.test(value)
  );
}
// Scoped authoring output: atom skin owns declarations; canvas components own geometry.
export function canvasAppearance(
  id: number,
  appearance: DesignerAppearance = {},
) {
  const base = `.action-canvas[data-node="${id}"]`;
  return appearanceStates
    .map((state) => {
      const entries = Object.entries(appearance[state] ?? {}).filter(
        ([key, value]) =>
          (appearanceProperties as readonly string[]).includes(key) &&
          validCSSValue(value) &&
          value,
      ) as [string, string][];
      if (!entries.length) return "";
      if (state === "normal")
        return (
          containerAppearance(base, entries) + effectAppearance(base, entries)
        );
      const selector = `${base}[data-preview-state="${state}"],${base}:not([data-preview-state]):${state === "disabled" ? "disabled" : state}`;
      return `${selector}{${entries.map(([key, value]) => `${key}:${value}`).join(";")}}`;
    })
    .join("\n");
}
