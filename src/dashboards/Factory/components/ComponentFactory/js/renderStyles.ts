import type { CSSProperties } from "react";
import { factorySizeCss, paddingCss } from "./sizeStyles";
import type { FactoryComposition, FactoryElement, FactoryGridLayout, FactorySurfaceStyle } from "../ComponentFactory.types";
import { factoryPaintClass } from "./paintStyles";

export const elementTag = (element: FactoryElement) => {
  if (element.nodeTag) return element.nodeTag;
  if (element.type === "Headline") return element.heading;
  if (element.type === "Button") return "button";
  if (element.type === "Link") return "a";
  return element.type === "Div" ? element.layoutTag ?? "div" : "span";
};

export const surfaceClass = (style?: FactorySurfaceStyle) =>
  [style?.container, style?.effect].filter(Boolean).join(" ");

export const cellLayoutCss = (composition: FactoryComposition, scope = "") => {
  return [["shell", composition.gridStyle ?? {}] as const, ...Object.entries(composition.areaStyles ?? {})].flatMap(([area, style]) => {
    const declarations = [];
    if (style.width !== undefined) declarations.push(`width: ${style.width}px;`);
    if (style.height !== undefined) declarations.push(`height: ${style.height}px;`);
    for (const [key, value] of Object.entries(paddingCss(style))) {
      if (value !== undefined) declarations.push(`${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}: ${value};`);
    }
    if (style.gap !== undefined) declarations.push(`gap: ${factorySizeCss(style.gap)};`);
    if (style.horizontalAlign) {
      const property = style.gridLayout ? "justify-items" : "text-align";
      declarations.push(`${property}: ${style.horizontalAlign};`);
    }
    if (style.verticalAlign) {
      const property = style.gridLayout ? "align-items" : "align-content";
      declarations.push(`${property}: ${style.verticalAlign};`);
    }
    declarations.push(...cssDeclarations(style.css));
    return declarations.length
      ? [`${scope}.${factoryPaintClass(area === "shell" ? "shell" : `area:${area}`, composition.name)} {\n  ${declarations.join("\n  ")}\n}`]
      : [];
  }).join("\n\n");
};

export const elementClass = (element: FactoryElement) => {
  return [element.container, element.action, element.effect].filter(Boolean).join(" ");
};

const unitless = new Set(["opacity", "zIndex", "fontWeight", "lineHeight", "flex", "flexGrow", "flexShrink", "order", "gridRow", "gridColumn", "gridRowStart", "gridRowEnd", "gridColumnStart", "gridColumnEnd", "aspectRatio", "scale"]);
export const cssDeclarations = (css?: CSSProperties) => Object.entries(css ?? {})
  .filter(([, value]) => value !== undefined && value !== null)
  .map(([key, value]) => `${key.startsWith("--") ? key : key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}: ${typeof value === "number" && value !== 0 && !unitless.has(key) && !key.startsWith("--") ? `${value}px` : value};`);

export const gridAttributes = (layout?: FactoryGridLayout) => ({
  "data-grid": layout?.grid === "single-cell" ? undefined : layout?.grid,
  "data-rows": layout?.grid === "single-cell" ? 1 : layout?.custom?.rows ?? layout?.rows,
  "data-cols": layout?.grid === "single-cell" ? 1 : layout?.custom?.cols ?? layout?.cols,
});

export const slotStyle = (layout: FactoryGridLayout, index: number): CSSProperties => {
  const drawn = layout.custom?.areas[index];
  if (drawn) {
    return {
      gridRow: `${drawn.r1} / span ${drawn.rows}`,
      gridColumn: `${drawn.c1} / span ${drawn.cols}`,
    };
  }
  const span = layout.spans?.[index];
  return {
    gridRow: span?.rows && span.rows > 1 ? `span ${span.rows}` : undefined,
    gridColumn: span?.cols && span.cols > 1 ? `span ${span.cols}` : undefined,
  };
};

export const elementStyle = (item: FactoryElement): CSSProperties | undefined => {
  if (item.type === "Text" || item.type === "Headline") {
    return { color: item.color, fontSize: item.size, ...item.css };
  }
  if (item.type === "Div") {
    return {
      display: item.gridLayout ? undefined : item.display,
      ...paddingCss(item),
      gap: factorySizeCss(item.gap),
      overflowX: item.scrollX ? "auto" : undefined,
      overflowY: item.scrollY ? "auto" : undefined,
      ...item.css,
    };
  }
  return item.css;
};

