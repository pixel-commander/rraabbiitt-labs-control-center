import type { CSSProperties } from "react";
import type {
  DesignerDocument,
  DesignerElement,
  DesignerMode,
} from "../RABDesigner.types.ts";
import { resolveElement, synchronizeDesign, allowsWidth } from "./htmlModel.ts";
import { locate } from "./document.ts";
import { nodeStyle } from "./nodeStyle.ts";
import { appearanceStates } from "./appearance.ts";
export function htmlStyle(
  node: DesignerElement,
  mode?: DesignerMode,
): CSSProperties {
  const {
    left: _left,
    top: _top,
    position: _position,
    ...skin
  } = nodeStyle(node);
  const style: CSSProperties = {
    ...skin,
    boxSizing: "border-box",
    minWidth: 0,
    display: node.layout?.display ?? (node.grid ? "grid" : "block"),
    gap: node.gap ?? 0,
    padding: node.padding ?? 0,
    ...node.layout,
  };
  if (!allowsWidth(mode, node)) {
    delete style.width;
    delete style.minWidth;
    delete style.maxWidth;
  }
  if (node["data-grid"]) {
    delete style.display;
    delete style.gridTemplateColumns;
    delete style.gridTemplateRows;
  }
  if (mode === "view") {
    style.height = node.layout?.height ?? "auto";
    if (node["data-area"]) style.width = node.layout?.width ?? "auto";
  }
  return style;
}
const escapeHTML = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
export function elementDeclarations(
  node: DesignerElement,
  mode?: DesignerMode,
) {
  const colors = {
    default: "var(--content-default)",
    muted: "var(--content-muted)",
    accent: "var(--accent-default)",
    secondary: "var(--accent-secondary)",
    success: "var(--success-default)",
  };
  const base: Record<string, string> = {
    "box-sizing": "border-box",
    width: node.layout?.width ?? `${node.width}px`,
    height: node.layout?.height ?? `${node.height}px`,
    display: node.layout?.display ?? (node.grid ? "grid" : "block"),
    gap: `${node.gap ?? 0}px`,
    padding: `${node.padding ?? 0}px`,
    background:
      node.backgroundColor ??
      (node.surface === "transparent"
        ? "transparent"
        : `var(--surface-${node.surface})`),
    color: colors[node.color],
    border: `${node.borderWidth ?? (node.type === "text" ? 0 : 1)}px ${node.borderStyle ?? "solid"} ${node.borderColor ?? "var(--border-default)"}`,
    "border-radius":
      node.borderRadius === undefined
        ? "var(--radius-container)"
        : `${node.borderRadius}px`,
    "font-size": `${node.fontSize}px`,
    "font-weight": String(node.fontWeight ?? 400),
    "white-space": "pre-wrap",
    opacity: String(node.opacity ?? 1),
    "box-shadow":
      !node.boxShadow || node.boxShadow === "none"
        ? "none"
        : `var(--effect-${node.boxShadow})`,
  };
  for (const [key, value] of Object.entries(node.layout ?? {}))
    if (value !== undefined)
      base[key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())] = String(value);
  if (base.display === "grid")
    base["grid-template-columns"] = `repeat(${node.cols ?? 2}, minmax(0, 1fr))`;
  if (!allowsWidth(mode, node)) {
    delete base.width;
    delete base["min-width"];
    delete base["max-width"];
  }
  if (node["data-grid"]) {
    delete base.display;
    delete base["grid-template-columns"];
  }
  if (mode === "view") {
    base.height = node["data-grid"] ? "100vh" : (node.layout?.height ?? "auto");
    if (node["data-area"]) base.width = node.layout?.width ?? "auto";
  }
  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(node.appearance?.normal ?? {}).filter(
        ([, value]) => value !== undefined,
      ),
    ),
  };
}
export function siteCode(
  source: DesignerDocument,
  selected?: DesignerElement,
  gridCSS = "",
) {
  const data = synchronizeDesign(source, source),
    nodes = selected
      ? [locate(data.children, selected.id)?.node ?? selected]
      : data.children,
    seen = new Set<string>(),
    rules: string[] = [];
  const declare = (
    selector: string,
    fields: Record<string, string | undefined>,
  ) =>
    `${selector} {\n${Object.entries(fields)
      .filter(([, v]) => v !== undefined)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join("\n")}\n}`;
  const visit = (
    node: DesignerElement,
    depth: number,
    jsx: boolean,
  ): string => {
    const n = resolveElement(data, node),
      name = n.className ?? `box-${n.id}`,
      tag = n.type === "text" ? "span" : "div",
      indent = jsx ? "  ".repeat(depth) : "";
    if (!seen.has(name)) {
      rules.push(declare(`.${name}`, elementDeclarations(n, data.mode)));
      for (const state of appearanceStates)
        if (
          state !== "normal" &&
          Object.keys(n.appearance?.[state] ?? {}).length
        )
          rules.push(
            declare(
              `.${name}${state === "disabled" ? '[aria-disabled="true"]' : ":" + state}`,
              n.appearance![state]!,
            ),
          );
      seen.add(name);
    }
    const text = n.content
      ? jsx
        ? `{${JSON.stringify(n.content)}}`
        : escapeHTML(n.content)
      : "";
    const children = n.children.map((child) => visit(child, depth + 1, jsx));
    return `${indent}<${tag} ${jsx ? "className" : "class"}="${name}"${n["data-grid"] ? ` data-grid="${n["data-grid"]}"` : ""}${n["data-area"] ? ` data-area="${n["data-area"]}"` : ""}>${text}${children.length ? (jsx ? "\n" + children.join("\n") + "\n" + indent : children.join("")) : ""}</${tag}>`;
  };
  const html = nodes.map((node) => visit(node, 0, false)).join("\n"),
    jsx = nodes.map((node) => visit(node, 0, true)).join("\n");
  const theme = declare(":root", source.theme ?? {}),
    css = [gridCSS, theme, ...rules].join("\n\n");
  const componentName = (selected?.className ?? "Composition")
    .split(/[-_]/)
    .filter(Boolean)
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join("");
  const scopedTheme = selected
    ? declare(`.${selected.className}`, source.theme ?? {})
    : theme;
  const componentCSS = [gridCSS, scopedTheme, ...rules].join("\n\n");
  const component = `export function ${componentName}() {\n  return (<>\n    <style>{${JSON.stringify(componentCSS)}}</style>\n${jsx
    .split("\n")
    .map((line) => "    " + line)
    .join("\n")}\n  </>);\n}\n`;
  const page = `<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(source.title)}</title>\n<style>body{margin:0;font-family:system-ui,sans-serif;background:var(--surface-app);color:var(--content-default)}\n${css}</style></head>\n<body>\n${html}\n</body>\n</html>`;
  return { html, jsx, css, component, page };
}
