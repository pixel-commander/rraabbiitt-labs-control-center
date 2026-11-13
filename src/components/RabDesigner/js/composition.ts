import type { DesignerElement } from "../RABDesigner.types.ts";
import { nodeStyle } from "./nodeStyle.ts";
import { canvasAppearance } from "./canvasAppearance.ts";
export function compositionCode(
  nodes: DesignerElement[],
  theme: Record<string, string> = {},
) {
  const scope = nodes[0]?.id ?? "empty";
  const css: string[] = Object.keys(theme).length
    ? [
        `[data-composition="${scope}"] {\n${Object.entries(theme)
          .map(([key, value]) => `  ${key}: ${value};`)
          .join("\n")}\n}`,
      ]
    : [];
  const visit = (node: DesignerElement, depth: number): string => {
    const indent = "  ".repeat(depth);
    const style = Object.entries(nodeStyle(node))
      .filter(([, v]) => v !== undefined)
      .map(([key, value]) => {
        const property = key.startsWith("--")
          ? key
          : key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
        const unit =
          typeof value === "number" &&
          ["left", "top", "width", "height", "fontSize"].includes(key)
            ? "px"
            : "";
        return `  ${property}: ${value}${unit};`;
      })
      .join("\n");
    css.push(
      `[data-node="${node.id}"] {\n  box-sizing: border-box;\n  white-space: pre-wrap;\n${style}\n}`,
    );
    css.push(canvasAppearance(node.id, node.appearance));
    const content = node.content
      ? `\n${indent}  <span>{${JSON.stringify(node.content)}}</span>`
      : "";
    const children = node.children.length
      ? `\n${node.children.map((n) => visit(n, depth + 1)).join("\n")}`
      : "";
    return `${indent}<div className="container-cell effect-canvas action-canvas"\n${indent}  data-node={${node.id}} aria-label={${JSON.stringify(node.title)}}>${content}${children}\n${indent}</div>`;
  };
  const body = nodes.map((n) => visit(n, 1)).join("\n");
  return {
    jsx: `<div data-composition="${scope}" style={{position: "relative"}}>\n${body}\n</div>`,
    css:
      css.filter(Boolean).join("\n") || "/* Uses the house atoms and theme. */",
  };
}
