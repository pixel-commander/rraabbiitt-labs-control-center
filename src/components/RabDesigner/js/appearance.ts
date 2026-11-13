import {
  appearanceProperties,
  appearanceStates,
  validCSSValue,
} from "./canvasAppearance.ts";
export {
  appearanceGroups,
  appearanceProperties,
  appearanceStates,
  validCSSValue,
} from "./canvasAppearance.ts";
export type {
  DesignerState,
  DesignerAppearance,
} from "./canvasAppearance.ts";
export function validateAppearance(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid appearance states.");
  for (const [state, fields] of Object.entries(value)) {
    if (
      !(appearanceStates as readonly string[]).includes(state) ||
      !fields ||
      typeof fields !== "object" ||
      Array.isArray(fields)
    )
      throw Error("Invalid appearance state.");
    for (const [key, v] of Object.entries(fields))
      if (
        !(appearanceProperties as readonly string[]).includes(key) ||
        !validCSSValue(v)
      )
        throw Error(`Invalid CSS property: ${key}.`);
  }
}
export function validateTheme(
  value: unknown,
): asserts value is Record<string, string> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length > 500
  )
    throw Error("Theme must be a token object (up to 500 tokens).");
  for (const [key, v] of Object.entries(value))
    if (!/^--[a-zA-Z][\w-]*$/.test(key) || !validCSSValue(v) || !v.trim())
      throw Error(`Invalid theme token: ${key}.`);
}
