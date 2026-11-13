import type { CSSProperties } from "react";
import type { DesignerElement } from "../RABDesigner.types";
export function nodeStyle(
  node: DesignerElement,
  inGrid = false,
  scale = 1,
): CSSProperties {
  const colors = {
    default: "var(--content-default)",
    muted: "var(--content-muted)",
    accent: "var(--accent-default)",
    secondary: "var(--accent-secondary)",
    success: "var(--success-default)",
  };
  return {
    position: inGrid ? "relative" : "absolute",
    left: inGrid ? undefined : node.x,
    top: inGrid ? undefined : node.y,
    width: inGrid ? "100%" : node.width,
    height: inGrid ? "100%" : node.height,
    fontSize: node.fontSize,
    fontWeight: node.fontWeight ?? 400,
    "--container-cell-background":
      node.backgroundColor ??
      (node.surface === "transparent"
        ? "transparent"
        : `var(--surface-${node.surface})`),
    "--container-cell-color": colors[node.color],
    "--container-cell-border": `${node.borderWidth ?? (node.type === "text" ? 0 : 1)}px ${node.borderStyle ?? "solid"} ${node.borderColor ?? "var(--border-default)"}`,
    "--container-cell-radius":
      node.borderRadius === undefined
        ? "var(--radius-container)"
        : `${node.borderRadius}px`,
    "--container-cell-shadow":
      !node.boxShadow || node.boxShadow === "none"
        ? "none"
        : `var(--effect-${node.boxShadow})`,
    "--canvas-opacity": node.opacity ?? 1,
    "--canvas-scale": scale,
  } as CSSProperties;
}
