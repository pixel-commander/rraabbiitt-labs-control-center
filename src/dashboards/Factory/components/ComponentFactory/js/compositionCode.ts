import { gridTypes } from "../../../../../components/GridLayoutDisplay/GridLayoutDisplay.types";
import type { FactoryComposition, FactoryGridLayout } from "../ComponentFactory.types";
import { gridSlots, layoutCells, rootCells } from "./gridSlots";
import { factoryPaintClass, factoryPaintCss } from "./paintStyles";
import { cellLayoutCss, elementClass, elementStyle, elementTag, gridAttributes, slotStyle, surfaceClass } from "./renderStyles";

const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const gridCode = (layout?: FactoryGridLayout) =>
  Object.entries(gridAttributes(layout))
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => ` ${key}="${value}"`)
    .join("");

const slotClass = (owner: string, index: number) =>
  `composition-slot-${owner.replaceAll("/", "-")}-${index + 1}`;

const slotCode = (layout: FactoryGridLayout, owner: string, content: string, render: (
  key: string, area: string | undefined, placement: string, content: string,
) => string) =>
  layoutCells(layout, owner).map((cell, index) => {
    const style = slotStyle(layout, index);
    const placement = style.gridRow || style.gridColumn ? slotClass(owner, index) : "";
    return render(cell.key, cell.name, placement, cell.receivesContent ? content : "");
  }).join("");

export const compositionCode = (composition: FactoryComposition, syntax: "html" | "jsx" = "html") => {
  const classAttribute = (value: string) =>
    value ? ` ${syntax === "jsx" ? "className" : "class"}="${escapeHtml(value)}"` : "";
  const shellLayout = composition.gridStyle?.gridLayout ?? { grid: composition.grid };
  const styles = composition.elements.flatMap((item) => {
    const declarations = Object.entries(elementStyle(item) ?? {})
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        const property = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
        return `  ${property}: ${typeof value === "number" ? `${value}px` : value};`;
      });
    return declarations.length ? [[item.id, declarations] as const] : [];
  });
  const slotLayouts: [string, FactoryGridLayout | undefined][] = [
    ["shell", shellLayout],
    ...Object.entries(composition.areaStyles ?? {}).map(([area, style]): [string, FactoryGridLayout | undefined] => [area, style.gridLayout]),
    ...composition.elements.map((item): [string, FactoryGridLayout | undefined] => [String(item.id), item.gridLayout]),
  ];
  const spanRules = slotLayouts.flatMap(([owner, layout]) =>
    layout ? gridSlots(layout).flatMap((_, index) => {
      const { gridRow, gridColumn } = slotStyle(layout, index);
      if (!gridRow && !gridColumn) return [];
      return [[
        `.${slotClass(owner, index)} {`,
        ...(gridRow ? [`  grid-row: ${gridRow};`] : []),
        ...(gridColumn ? [`  grid-column: ${gridColumn};`] : []),
        "}",
      ].join("\n")];
    }) : [],
  );
  const cssRules = [...styles.map(([id, declarations]) =>
    [`.${factoryPaintClass(`item:${id}`, composition.name)} {`, ...declarations, "}"].join("\n"),
  ), ...spanRules, factoryPaintCss(composition), cellLayoutCss(composition)].filter(Boolean).join("\n\n");
  const temporaryClasses = new Set([factoryPaintClass("shell", composition.name)]);
  const areaCode = (area: string, name?: string, placement = "", content = "", tag = "div"): string => {
    const areaStyle = composition.areaStyles?.[area];
    const areaLayout = areaStyle?.gridLayout;
    const items = composition.elements.filter((item) => item.area === area).map((item) => {
      const tag = elementTag(item);
      const temporaryClass = factoryPaintClass(`item:${item.id}`, composition.name);
      if (item.type === "Div") temporaryClasses.add(temporaryClass);
      const classes = [elementClass(item), temporaryClass].filter(Boolean).join(" ");
      const content = item.text
        ? syntax === "jsx" ? `{${JSON.stringify(item.text)}}` : escapeHtml(item.text)
        : "";
      const href = item.type === "Link"
        ? ` href="${(item.href ?? "#").replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}"`
        : "";
      return `<${tag}${href}${gridCode(item.gridLayout)}${classAttribute(classes)}${item.type === "Button" && item.disabled ? " disabled" : ""}>${item.gridLayout ? slotCode(item.gridLayout, String(item.id), content, (key, name, placement, body) => areaCode(key, name, placement, body, item.type === "Div" && tag !== "span" ? "div" : "span")) : content}</${tag}>`;
    }).join("");
    const areaAttribute = name ? ` data-area="${name}"` : "";
    const temporaryClass = factoryPaintClass(`area:${area}`, composition.name);
    temporaryClasses.add(temporaryClass);
    const classes = [placement, surfaceClass(areaStyle), areaStyle?.scrollY && "scroll-y", temporaryClass].filter(Boolean).join(" ");
    const body = (syntax === "jsx" && area === "main" ? "{children}" : "") + content + items;
    return `<${tag}${areaAttribute}${gridCode(areaLayout)}${classAttribute(classes)}>${areaLayout ? slotCode(areaLayout, area, body, (key, name, placement, content) => areaCode(key, name, placement, content, tag)) : body}</${tag}>`;
  };
  const areas = gridTypes[composition.grid];
  const shellChildren = rootCells(shellLayout, areas).map((cell, index) => {
    const style = cell.inheritedAreas ? slotStyle(shellLayout, index) : undefined;
    const placement = style?.gridRow || style?.gridColumn ? slotClass("shell", index) : "";
    return areaCode(cell.key, cell.name, placement, cell.inheritedAreas?.map((area) => areaCode(area)).join(""));
  });
  const html = [
    `<div${gridCode(shellLayout)}${classAttribute([surfaceClass(composition.gridStyle), factoryPaintClass("shell", composition.name)].join(" "))}>`,
    ...shellChildren.map((child) => `  ${child}`),
    "</div>",
  ].join("\n");
  const css = [
    cssRules,
    ...Array.from(temporaryClasses)
      .filter((className) => !cssRules.includes(`.${className} {`))
      .map((className) => `.${className} {\n}`),
  ].filter(Boolean).join("\n\n");
  return { html, css, code: html };
};
