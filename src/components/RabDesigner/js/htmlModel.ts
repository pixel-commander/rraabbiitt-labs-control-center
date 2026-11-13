import type {
  DesignerDocument,
  DesignerElement,
  DesignerMode,
  DesignerClass,
} from "../RABDesigner.types.ts";
import { validCSSValue } from "./appearance.ts";
import { newElement, locate } from "./document.ts";
export const layoutOptions = {
  display: ["block", "flex", "grid"],
  flexDirection: ["row", "column", "row-reverse", "column-reverse"],
  justifyContent: [
    "flex-start",
    "center",
    "flex-end",
    "space-between",
    "space-around",
    "space-evenly",
  ],
  alignItems: ["stretch", "flex-start", "center", "flex-end", "baseline"],
  flexWrap: ["nowrap", "wrap"],
  textAlign: ["left", "center", "right", "justify"],
  overflow: ["visible", "hidden", "auto", "scroll"],
} as const;
export const layoutLengths = [
  "width",
  "height",
  "minWidth",
  "maxWidth",
  "minHeight",
  "maxHeight",
  "margin",
] as const;
export const styleKeys = [
  "width",
  "height",
  "surface",
  "color",
  "fontSize",
  "fontWeight",
  "grid",
  "cols",
  "rows",
  "gap",
  "padding",
  "backgroundColor",
  "borderColor",
  "borderWidth",
  "borderStyle",
  "borderRadius",
  "boxShadow",
  "opacity",
  "appearance",
  "layout",
] as const;
export const isHtml = (data: DesignerDocument) =>
  data.mode === "html" || data.mode === "dev" || data.mode === "view";
export const validClassName = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= 80 &&
  !Object.hasOwn(Object.prototype, value) &&
  value !== "prototype" &&
  /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value);
export const isGrid = (node: DesignerElement) =>
  (node.layout?.display ?? (node.grid ? "grid" : "block")) === "grid";
export const allowsWidth = (
  mode: DesignerMode | undefined,
  node: DesignerElement,
) =>
  (mode !== "dev" && mode !== "view") ||
  isGrid(node) ||
  !!node["data-area"] ||
  !!node["data-grid"];
export const validLayoutLength = (value: unknown): value is string =>
  validCSSValue(value) && value.length <= 120 && !!value.trim();
export function resolveElement(
  data: DesignerDocument,
  node: DesignerElement,
): DesignerElement {
  const resolved =
    data.mode === "dev" && node.className && data.classes?.[node.className]
      ? { ...node, ...data.classes[node.className].styles, width: node.width }
      : node;
  if (!allowsWidth(data.mode, resolved)) {
    const {
      width: _width,
      minWidth: _min,
      maxWidth: _max,
      ...layout
    } = resolved.layout ?? {};
    return { ...resolved, layout };
  }
  return resolved;
}
const stylesOf = (node: DesignerElement) =>
  Object.fromEntries(
    styleKeys
      .filter((key) => key !== "width" && node[key] !== undefined)
      .map((key) => [key, structuredClone(node[key])]),
  ) as Partial<DesignerElement>;
export function synchronizeDesign(
  before: DesignerDocument,
  next: DesignerDocument,
): DesignerDocument {
  if ((before.mode ?? "canvas") !== (next.mode ?? "canvas"))
    throw Error("A composition mode cannot be changed.");
  if (!isHtml(next)) return next;
  const classes: Record<string, DesignerClass> = structuredClone(
      next.classes ?? {},
    ),
    names = new Set(Object.keys(classes)),
    seen = new Set<string>();
  const collect = (nodes: DesignerElement[]) =>
    nodes.forEach((n) => {
      if (n.className) names.add(n.className);
      collect(n.children);
    });
  collect(next.children);
  const name = () => {
    let i = 1;
    while (names.has(`box-${i}`)) i++;
    const value = `box-${i}`;
    names.add(value);
    return value;
  };
  const visit = (nodes: DesignerElement[]): DesignerElement[] =>
    nodes.map((n) => {
      const className =
        n.className &&
        !(
          (next.mode === "html" || next.mode === "view") &&
          seen.has(n.className)
        )
          ? n.className
          : name();
      seen.add(className);
      const node = { ...n, className, children: visit(n.children) };
      if (next.mode === "dev") {
        if (!classes[className])
          classes[className] = { styles: stylesOf(node) };
        else {
          const old = locate(before.children, node.id)?.node;
          if (old && old.className === className) {
            const changes = Object.fromEntries(
              styleKeys
                .filter(
                  (key) =>
                    key !== "width" &&
                    JSON.stringify(old[key]) !== JSON.stringify(node[key]),
                )
                .map((key) => [key, node[key]]),
            );
            classes[className] = {
              styles: { ...classes[className].styles, ...changes },
            };
          }
        }
      }
      return node;
    });
  const children = visit(next.children);
  const materialize = (nodes: DesignerElement[]): DesignerElement[] =>
    nodes.map((n) => ({
      ...resolveElement({ ...next, classes }, n),
      children: materialize(n.children),
    }));
  return {
    ...next,
    children: next.mode === "dev" ? materialize(children) : children,
    ...(next.mode === "dev" ? { classes } : {}),
  };
}
export function renameClass(
  data: DesignerDocument,
  id: number,
  className: string,
) {
  if (!validClassName(className))
    throw Error(
      "Use lowercase kebab-case, such as info-card (letters, numbers and single hyphens).",
    );
  const source = locate(data.children, id)?.node;
  if (!source) return data;
  if (source.className === className) return data;
  const contains = (nodes: DesignerElement[]): boolean =>
    nodes.some((n) => n.className === className || contains(n.children));
  if (data.classes?.[className] || contains(data.children))
    throw Error(
      "That class already exists. Insert an instance from Saved classes to reuse it.",
    );
  const old = source.className,
    classes = { ...data.classes };
  if (data.mode === "dev" && old && classes[old]) {
    classes[className] = classes[old];
    delete classes[old];
  }
  const visit = (nodes: DesignerElement[]): DesignerElement[] =>
    nodes.map((n) => ({
      ...n,
      className: (data.mode === "dev" ? n.className === old : n.id === id)
        ? className
        : n.className,
      children: visit(n.children),
    }));
  return { ...data, classes, children: visit(data.children) };
}

export function instantiateClass(
  data: DesignerDocument,
  className: string,
): DesignerElement {
  const find = (nodes: DesignerElement[]): DesignerElement | undefined => {
    for (const node of nodes) {
      if (node.className === className) return node;
      const child = find(node.children);
      if (child) return child;
    }
  };
  const source = find(data.children);
  const clone = (node: DesignerElement): DesignerElement => ({
    ...structuredClone(resolveElement(data, node)),
    id: newElement("box", 0, 0).id,
    children: node.children.map(clone),
  });
  return {
    ...(source
      ? clone(source)
      : {
          ...newElement("box", 40, 40),
          className,
          ...data.classes?.[className]?.styles,
        }),
    x: 40 + data.children.length * 24,
    y: 40 + data.children.length * 24,
  };
}
