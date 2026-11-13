import { factorySizeCss, radiusCorners } from "./sizeStyles";
import type { FactoryActionState, FactoryComposition, FactoryPaint } from "../ComponentFactory.types";

export const actionStates: FactoryActionState[] = ["default", "selected", "hover", "mousedown", "disabled"];
const selectors = { default: "", selected: '[aria-pressed="true"]', hover: ":hover:not(:disabled)", mousedown: ":active:not(:disabled)", disabled: ":disabled" };
export const strokeSides = ["all", "top", "right", "bottom", "left"] as const;

export const factoryPaintClass = (key: string, name?: string) => {
  const slug = name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const prefix = slug ? (/^[0-9]/.test(slug) ? `component-${slug}` : slug) : "composition";
  const suffix = key.replace(":", "-").replace(/[^a-zA-Z0-9-]/gu, (character) =>
    `_${character.codePointAt(0)?.toString(16)}_`,
  );
  return `${prefix}-${suffix}`;
};

export const factoryPaintCss = (composition: FactoryComposition, scope = "") => {
  const rules: string[] = [];
  const add = (key: string, paint?: FactoryPaint, suffix = "") => {
    if (!paint) return;
    const declarations: string[] = [];
    if (paint.gradient) declarations.push(`background: linear-gradient(${paint.angle ?? 180}deg, ${paint.background || "#ffffff"}, ${paint.gradientEnd || "#000000"});`);
    else if (paint.background) declarations.push(`background: ${paint.background};`);
    if (paint.radiusAll !== false) {
      if (paint.radius !== undefined) declarations.push(`border-radius: ${factorySizeCss(paint.radius, "radius")};`);
    } else {
      for (const corner of radiusCorners) {
        const value = factorySizeCss(paint.radiusCorners?.[corner], "radius");
        if (value !== undefined) declarations.push(`border-${corner}-radius: ${value};`);
      }
    }
    for (const side of strokeSides) {
      const border = paint.borders?.[side];
      if (!border) continue;
      const prefix = side === "all" ? "border" : `border-${side}`;
      if (border.width !== undefined) declarations.push(`${prefix}-width: ${border.width}px;`);
      if (border.style) declarations.push(`${prefix}-style: ${border.style};`);
      if (border.color) declarations.push(`${prefix}-color: ${border.color};`);
    }
    if (paint.shadows?.length) declarations.push(`box-shadow: ${paint.shadows.map(({ inset, x, y, blur, spread, color }) => `${inset ? "inset " : ""}${x}px ${y}px ${blur}px ${spread}px ${color}`).join(", ")};`);
    if (declarations.length) rules.push(`${scope}.${factoryPaintClass(key, composition.name)}${suffix} {\n  ${declarations.join("\n  ")}\n}`);
  };
  const colors = Object.entries(composition.colors ?? {});
  if (colors.length) rules.push(`${scope}.${factoryPaintClass("shell", composition.name)} {\n  ${colors.map(([name, color]) => `${name}: ${color};`).join("\n  ")}\n}`);
  add("shell", composition.gridStyle?.paint);
  for (const [area, style] of Object.entries(composition.areaStyles ?? {})) add(`area:${area}`, style.paint);
  for (const item of composition.elements) {
    if (item.type === "Div") add(`item:${item.id}`, item.paint);
    if (item.type === "Button") for (const state of actionStates) add(`item:${item.id}`, item.states?.[state], selectors[state]);
  }
  return rules.join("\n\n");
};

