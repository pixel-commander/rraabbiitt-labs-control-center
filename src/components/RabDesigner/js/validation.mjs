import { viewGrids } from "./viewGrid.ts";
import {
  validateAppearance,
  validateTheme,
  validCSSValue,
} from "./appearance.ts";
import {
  layoutOptions,
  layoutLengths,
  styleKeys,
  validClassName,
  validLayoutLength,
} from "./htmlModel.ts";
export function validateDocument(data) {
  if (
    data?.mode !== undefined &&
    !["canvas", "html", "dev", "view"].includes(data.mode)
  )
    throw Error("Invalid designer mode.");
  if (data?.theme !== undefined) validateTheme(data.theme);
  const ids = new Set();
  let count = 0;
  const number = (n, min, max) =>
    typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
  const identity = (n) => Number.isSafeInteger(n) && n > 0;
  if (
    !data ||
    data.schema !== 1 ||
    !identity(data.id) ||
    typeof data.title !== "string" ||
    data.title.length > 120 ||
    !Array.isArray(data.children)
  )
    throw Error("Invalid composition.");
  const visit = (nodes, depth) => {
    if (depth > 32) throw Error("Composition nesting is too deep.");
    for (const n of nodes) {
      if (
        ++count > 2000 ||
        !n ||
        !identity(n.id) ||
        ids.has(n.id) ||
        !["box", "text"].includes(n.type)
      )
        throw Error("Invalid or duplicate node.");
      ids.add(n.id);
      if (
        n["data-grid"] !== undefined &&
        !Object.hasOwn(viewGrids, n["data-grid"])
      )
        throw Error("Invalid house grid.");
      if (
        n["data-area"] !== undefined &&
        !["header", "main", "footer", "side", "left", "right"].includes(
          n["data-area"],
        )
      )
        throw Error("Invalid house area.");
      if (n.className !== undefined && !validClassName(n.className))
        throw Error("Invalid CSS class name.");
      if (n.layout !== undefined) {
        if (
          !n.layout ||
          typeof n.layout !== "object" ||
          Array.isArray(n.layout)
        )
          throw Error("Invalid HTML layout.");
        for (const [key, value] of Object.entries(n.layout)) {
          if (value === undefined) continue;
          if (layoutOptions[key]) {
            if (!layoutOptions[key].includes(value))
              throw Error(`Invalid ${key}.`);
          } else if (layoutLengths.includes(key)) {
            if (!validLayoutLength(value)) throw Error(`Invalid ${key}.`);
          } else if (
            !["flexGrow", "flexShrink"].includes(key) ||
            !number(value, 0, 100)
          )
            throw Error(`Invalid layout property ${key}.`);
        }
      }
      if (n.appearance !== undefined) validateAppearance(n.appearance);
      if (n.grid !== undefined && !["columns", "rows"].includes(n.grid))
        throw Error("Invalid grid.");
      for (const key of ["cols", "rows"])
        if (
          n[key] !== undefined &&
          (!Number.isInteger(n[key]) || n[key] < 1 || n[key] > 12)
        )
          throw Error("Invalid track count.");
      if (
        !number(n.x, -100000, 100000) ||
        !number(n.y, -100000, 100000) ||
        !number(n.width, 1, 10000) ||
        !number(n.height, 1, 10000)
      )
        throw Error("Invalid node dimensions.");
      if (
        typeof n.title !== "string" ||
        n.title.length > 200 ||
        typeof n.content !== "string" ||
        n.content.length > 5000 ||
        !Array.isArray(n.children)
      )
        throw Error("Invalid node content.");
      if (
        !["main", "inset", "float", "transparent"].includes(n.surface) ||
        !["default", "muted", "accent", "secondary", "success"].includes(
          n.color,
        ) ||
        !number(n.fontSize, 8, 120)
      )
        throw Error("Invalid appearance.");
      if (
        n.fontWeight !== undefined &&
        ![400, 500, 600, 700].includes(n.fontWeight)
      )
        throw Error("Invalid font weight.");
      for (const [key, max] of [
        ["gap", 1000],
        ["padding", 1000],
        ["borderWidth", 100],
        ["borderRadius", 5000],
        ["opacity", 1],
      ])
        if (n[key] !== undefined && !number(n[key], 0, max))
          throw Error(`Invalid ${key}.`);
      for (const key of ["backgroundColor", "borderColor"])
        if (
          n[key] !== undefined &&
          (!validCSSValue(n[key]) ||
            !/^(#[0-9a-fA-F]{3,8}|[a-z]+|(?:rgba?|hsla?|color|color-mix|oklch|oklab|lab|lch|var)\(.+\))$/i.test(
              n[key],
            ))
        )
          throw Error(`Invalid ${key}.`);
      if (
        n.borderStyle !== undefined &&
        !["none", "solid", "dashed", "dotted", "double"].includes(n.borderStyle)
      )
        throw Error("Invalid border style.");
      if (
        n.boxShadow !== undefined &&
        !["none", "float", "inset"].includes(n.boxShadow)
      )
        throw Error("Invalid shadow.");
      visit(n.children, depth + 1);
    }
  };
  visit(data.children, 0);
  if (data.classes !== undefined) {
    if (
      !data.classes ||
      typeof data.classes !== "object" ||
      Array.isArray(data.classes) ||
      Object.keys(data.classes).length > 2000
    )
      throw Error("Invalid class library.");
    for (const [name, definition] of Object.entries(data.classes)) {
      if (
        !validClassName(name) ||
        !definition?.styles ||
        typeof definition.styles !== "object" ||
        Array.isArray(definition.styles) ||
        Object.keys(definition.styles).some((key) => !styleKeys.includes(key))
      )
        throw Error("Invalid reusable class.");
      const sample = {
        id: 1,
        title: name,
        type: "box",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        content: "",
        surface: "main",
        color: "default",
        fontSize: 16,
        ...definition.styles,
        children: [],
      };
      validateDocument({
        schema: 1,
        id: 1,
        title: "Class validation",
        children: [sample],
      });
    }
  }
  return data;
}
