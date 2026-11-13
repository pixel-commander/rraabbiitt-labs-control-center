import type { CSSProperties } from "react";
import { factorySizeCss, paddingCss } from "./sizeStyles";
import type { FactoryComposition, FactoryElement, FactoryGridLayout, FactorySurfaceStyle } from "../ComponentFactory.types";
import { factoryPaintClass } from "./paintStyles";

export const elementTag = (element: FactoryElement) => {
  if (element.type === "Headline") return element.heading;
  if (element.type === "Button") return "button";
  if (element.type === "Link") return "a";
  return element.type === "Div" ? element.layoutTag ?? "div" : "span";
};

export const surfaceClass = (style?: FactorySurfaceStyle) =>
  [style?.container, style?.effect].filter(Boolean).join(" ");

export const cellLayoutCss = (composition: FactoryComposition, scope = "") => {
  return Object.entries(composition.areaStyles ?? {}).flatMap(([area, style]) => {
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
    return declarations.length
      ? [`${scope}.${factoryPaintClass(`area:${area}`, composition.name)} {\n  ${declarations.join("\n  ")}\n}`]
      : [];
  }).join("\n\n");
};

export const elementClass = (element: FactoryElement) => {
  if (element.type === "Div") return surfaceClass(element);
  if (element.type === "Button") return element.action;
  return "";
};

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
    return { color: item.color, fontSize: item.size };
  }
  if (item.type === "Div") {
    return {
      display: item.gridLayout ? undefined : item.display,
      ...paddingCss(item),
      gap: factorySizeCss(item.gap),
      overflowX: item.scrollX ? "auto" : undefined,
      overflowY: item.scrollY ? "auto" : undefined,
    };
  }
};

