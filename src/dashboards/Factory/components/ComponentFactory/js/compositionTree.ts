import { validateComposition } from "./validateComposition/validateComposition";
import type { FactoryComposition, FactoryDocument, FactoryElement, FactoryNode, EditorFactoryDocument, EditorFactoryNode } from "../ComponentFactory.types";
import { gridTypes } from "../../../../../components/GridLayoutDisplay/GridLayoutDisplay.types";
import { elementTag } from "./renderStyles";
import { factoryPaintCss } from "./paintStyles";
import { factorySizes, paddingCss } from "./sizeStyles";
import type { CSSProperties } from "react";
import { layoutCells, rootCells } from "./gridSlots";

let nextId = Date.now();
const id = () => ++nextId;
const defaultFrame = { x: 24, y: 24, width: 480, height: 280 };

/** Project the document into the existing editor controls. The tree remains the stored source. */
function editorToComposition(document: EditorFactoryDocument): FactoryComposition {
  const { root, editor, version: _version, ...metadata } = document;
  const composition: FactoryComposition = {
    ...metadata, rootTag: root.tag, grid: root.layout?.grid ?? "single-cell", frame: editor?.frame ?? defaultFrame,
    gridStyle: { ...root.style, css: root.css, container: root.container_class, effect: root.effect_class, gridLayout: root.layout },
    areaStyles: {}, elements: [],
  };
  const visit = (node: EditorFactoryNode, parentArea: string) => {
    if (node.kind === "area") {
      const key = node.area ?? String(node.id);
      composition.areaStyles![key] = { ...node.style, css: node.css, container: node.container_class, effect: node.effect_class, gridLayout: node.layout };
      node.children?.forEach(child => visit(child, key));
      return;
    }
    const type = node.tag === "button" ? "Button" : node.tag === "a" ? "Link" : /^h[1-6]$/.test(node.tag) ? "Headline" : ["span", "p", "strong", "em", "small"].includes(node.tag) ? "Text" : "Div";
    const childArea = node.children?.some(child => child.kind !== "area") ? `${node.id}/content` : undefined;
    composition.elements.push({
      color: typeof node.css?.color === "string" ? node.css.color : "#dfe4ee", size: typeof node.css?.fontSize === "number" ? node.css.fontSize : 16, ...node.style,
      id: node.id, nodeName: node.name, nodeTag: node.tag, type, area: parentArea, text: node.text ?? "",
      layoutTag: type === "Div" ? node.tag as FactoryElement["layoutTag"] : undefined,
      heading: type === "Headline" ? node.tag as FactoryElement["heading"] : node.style?.heading ?? "h2",
      container: node.container_class ?? "", action: node.atom_class ?? "", effect: node.effect_class ?? "",
      css: node.css, states: node.states, href: node.href, disabled: node.disabled, gridLayout: node.layout, childArea,
    });
    node.children?.forEach(child => visit(child, childArea ?? parentArea));
  };
  root.children?.forEach(node => visit(node, "main"));
  return composition;
}

/** Materialize preset areas and preserve stable identities while editing through the controls. */
function compositionToEditor(composition: FactoryComposition, previous?: EditorFactoryDocument): EditorFactoryDocument {
  const old = new Map<string, EditorFactoryNode>();
  const collect = (node: EditorFactoryNode) => { old.set(node.kind === "area" ? `area:${node.area}` : `node:${node.id}`, node); node.children?.forEach(collect); };
  if (previous) collect(previous.root);
  const { elements, frame, grid, gridStyle, areaStyles, rootTag, ...metadata } = composition;
  const reconcile = (prior: EditorFactoryNode[] | undefined, direct: EditorFactoryNode[]): EditorFactoryNode[] => {
    const used = new Set<number>();
    const children = (prior ?? []).flatMap(node => {
      const updated = direct.find(child => child.id === node.id) ?? (node.kind === "area" ? areaNode(node.area ?? String(node.id), node.name) : undefined);
      if (!updated) return [];
      used.add(updated.id); return [updated];
    });
    return [...children, ...direct.filter(node => !used.has(node.id))];
  };
  const areaNode = (key: string, name: string, inherited: EditorFactoryNode[] = []): EditorFactoryNode => {
    const style = areaStyles?.[key];
    const children = [...inherited, ...elements.filter(item => item.area === key).map(elementNode)];
    return {
      ...old.get(`area:${key}`),
      id: old.get(`area:${key}`)?.id ?? id(), name: old.get(`area:${key}`)?.name ?? name, kind: "area", area: key, tag: old.get(`area:${key}`)?.tag ?? "div",
      container_class: style?.container, effect_class: style?.effect, css: style?.css,
      style: cleanStyle(style), layout: style?.gridLayout,
      children: style?.gridLayout ? slots(style.gridLayout, key, children) : reconcile(old.get(`area:${key}`)?.children, children),
    };
  };
  const slots = (layout: NonNullable<EditorFactoryNode["layout"]>, owner: string, children: EditorFactoryNode[]) =>
    layoutCells(layout, owner).map(cell => areaNode(cell.key, cell.label, cell.receivesContent ? children : []));
  function elementNode(item: FactoryElement): EditorFactoryNode {
    const { id: nodeId, nodeName, nodeTag: _tag, type: _type, area: _area, text, container, action, effect, css, gridLayout, childArea, states, href, disabled, ...style } = item;
    const children = childArea ? elements.filter(child => child.area === childArea).map(elementNode) : [];
    return { id: nodeId, name: nodeName ?? (text || item.type), tag: elementTag(item),
      container_class: container || undefined, atom_class: action || undefined, effect_class: effect || undefined,
      text: text || undefined, css, layout: gridLayout, style, states, href, disabled,
      children: gridLayout ? slots(gridLayout, String(nodeId), children) : reconcile(old.get(`node:${nodeId}`)?.children, children),
    };
  }
  const layout = gridStyle?.gridLayout ?? (previous && !previous.root.layout ? undefined : { grid });
  const result: EditorFactoryDocument = { ...metadata, version: 2, editor: { frame }, root: {
    ...previous?.root,
    id: previous?.root.id ?? id(), name: previous?.root.name ?? composition.name ?? "composition", tag: rootTag ?? "div",
    container_class: gridStyle?.container, effect_class: gridStyle?.effect, css: gridStyle?.css,
    style: cleanStyle(gridStyle), layout,
    children: layout ? rootCells(layout, gridTypes[grid]).map(cell => areaNode(cell.key, cell.label, cell.inheritedAreas?.map(area => areaNode(area, area)))) : reconcile(previous?.root.children, elements.filter(item => item.area === "main").map(elementNode)),
  } };
  if (previous) {
    const before = editorToComposition(previous);
    const topology = (value: FactoryComposition) => JSON.stringify({
      grid: value.grid, rootLayout: value.gridStyle?.gridLayout,
      areas: Object.entries(value.areaStyles ?? {}).map(([key, style]) => [key, style.gridLayout]),
      elements: value.elements.map(item => [item.id, item.area, item.gridLayout, item.childArea]),
    });
    if (topology(before) === topology(composition)) {
      const preserve = (node: EditorFactoryNode, root = false): EditorFactoryNode => {
        const updated = root ? result.root : node.kind === "area" ? areaNode(node.area ?? String(node.id), node.name) : elementNode(elements.find(item => item.id === node.id)!);
        return { ...updated, children: node.children?.map(child => preserve(child)) ?? [] };
      };
      result.root = preserve(previous.root, true);
    }
  }
  return result;
}

function cleanStyle(style?: EditorFactoryNode["style"]) {
  if (!style) return undefined;
  const { container: _container, effect: _effect, css: _css, gridLayout: _layout, ...rest } = style;
  return Object.keys(rest).length ? rest : undefined;
}


/** Translate the public node fields into the private projection used by existing controls. */
export function toEditorDocument(document: FactoryDocument): EditorFactoryDocument {
  const convert = (node: FactoryNode, owner = "shell", root = false, rootPreset = false, parent?: FactoryNode): EditorFactoryNode => {
    const area = node.grid_area === undefined ? undefined : rootPreset ? node.grid_area : `${owner}/${node.grid_area}`;
    const layout = node.grid_type || node.grid_rows || node.grid_cols || node.grid_custom
      ? { grid: node.grid_type, rows: node.grid_rows, cols: node.grid_cols, custom: node.grid_custom, spans: node.grid_spans } : undefined;
    const padding = typeof node.padding === "object" ? undefined : node.padding;
    const css = { ...node.css } as Record<string, unknown>;
    if (node.grid_area && /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(node.grid_area) && parent?.grid_type !== "single-cell" && !parent?.grid_custom) css.gridArea = node.grid_area;
    if (node.scroll_x !== undefined) css.overflowX = node.scroll_x ? "auto" : "visible";
    if (node.scroll_y !== undefined) css.overflowY = node.scroll_y ? "auto" : "visible";
    const size = (value: string | number) => factorySizes.includes(value as typeof factorySizes[number]) ? `var(--space-${value})` : value;
    if (padding !== undefined) css.padding = size(padding);
    if (typeof node.padding === "object") for (const [side, value] of Object.entries(node.padding)) {
      if (value !== undefined) css[`padding${side[0].toUpperCase()}${side.slice(1)}`] = size(value);
    }
    if (node.gap !== undefined) css.gap = size(node.gap);
    return {
      id: node.id, name: node.name, tag: node.tag, kind: area === undefined ? undefined : "area", area,
      container_class: node.container_class, atom_class: node.action_class, effect_class: node.effect_class,
      text: node.text, href: node.href, disabled: node.disabled, states: node.states, layout,
      css: css as CSSProperties,
      style: {
        padding: typeof padding === "number" || factorySizes.includes(padding as typeof factorySizes[number]) ? padding as number | typeof factorySizes[number] : undefined,
        paddingAll: typeof node.padding !== "object", paddingSides: typeof node.padding === "object" ? node.padding as FactoryElement["paddingSides"] : undefined,
        gap: factorySizes.includes(node.gap as typeof factorySizes[number]) ? node.gap as typeof factorySizes[number] : undefined,
        scrollX: node.scroll_x, scrollY: node.scroll_y,
        paint: cssToPaint(node.css),
        width: typeof node.css?.width === "number" ? node.css.width : undefined,
        height: typeof node.css?.height === "number" ? node.css.height : undefined,
        display: node.css?.display as FactoryElement["display"],
        horizontalAlign: (node.css?.justifyItems ?? node.css?.textAlign) as import("../ComponentFactory.types").FactorySurfaceStyle["horizontalAlign"],
        verticalAlign: (node.css?.alignItems ?? node.css?.alignContent) as import("../ComponentFactory.types").FactorySurfaceStyle["verticalAlign"],
      },
      children: node.children?.map(child => convert(child, root ? "shell" : area ?? String(node.id), false, root && Boolean(node.grid_type), node)),
    };
  };
  return { ...document, root: convert(document.root, "shell", true) };
}

// Rehydrate paint controls from the CSS we emit, so the public JSON needs no style wrapper.
function cssToPaint(css?: CSSProperties): FactoryElement["paint"] {
  if (!css) return undefined;
  const paint: NonNullable<FactoryElement["paint"]> = {};
  const split = (value: string) => {
    const parts: string[] = []; let level = 0; let start = 0;
    for (let index = 0; index < value.length; index++) {
      if (value[index] === "(") level++;
      if (value[index] === ")") level--;
      if (value[index] === "," && level === 0) { parts.push(value.slice(start, index).trim()); start = index + 1; }
    }
    parts.push(value.slice(start).trim()); return parts;
  };
  const size = (value: unknown) => typeof value === "number" ? value : typeof value === "string" && /^-?[\d.]+px$/.test(value) ? Number.parseFloat(value) : typeof value === "string" ? value.match(/^var\(--radius-(xs|sm|md|base|lg|xl)\)$/)?.[1] as typeof factorySizes[number] | undefined : undefined;
  const background = css.background ?? css.backgroundColor;
  if (typeof background === "string") {
    const gradient = background.match(/^linear-gradient\((.*)\)$/);
    const stops = gradient ? split(gradient[1]) : [];
    if (stops.length === 3 && /^-?[\d.]+deg$/.test(stops[0])) {
      Object.assign(paint, { gradient: true, angle: Number.parseFloat(stops[0]), background: stops[1], gradientEnd: stops[2] });
    } else paint.background = background;
  }
  if (css.borderRadius !== undefined) paint.radius = size(css.borderRadius);
  const record = css as Record<string, unknown>;
  for (const corner of ["top-left", "top-right", "bottom-right", "bottom-left"] as const) {
    const key = `border${corner.split("-").map(word => word[0].toUpperCase() + word.slice(1)).join("")}Radius`;
    if (record[key] !== undefined) {
      paint.radiusAll = false; paint.radiusCorners ??= {};
      paint.radiusCorners[corner] = size(record[key]);
    }
  }
  for (const side of ["all", "top", "right", "bottom", "left"] as const) {
    const prefix = side === "all" ? "border" : `border${side[0].toUpperCase()}${side.slice(1)}`;
    if (["Width", "Style", "Color"].some(suffix => record[prefix + suffix] !== undefined)) {
      paint.borders ??= {};
      const width = Number.parseFloat(String(record[prefix + "Width"]));
      paint.borders[side] = { width: Number.isFinite(width) ? width : undefined, style: record[prefix + "Style"] as string | undefined, color: record[prefix + "Color"] as string | undefined };
    }
  }
  if (typeof css.boxShadow === "string") {
    paint.shadows = split(css.boxShadow).flatMap(value => {
      const match = value.match(/^(inset\s+)?(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(.+)$/);
      return match ? [{ inset: Boolean(match[1]), x: +match[2], y: +match[3], blur: +match[4], spread: +match[5], color: match[6] }] : [];
    });
  }
  return Object.keys(paint).length ? paint : undefined;
}

function paintCss(paint?: FactoryElement["paint"]): CSSProperties {
  if (!paint) return {};
  const rule = factoryPaintCss({ grid: "single-cell", frame: defaultFrame, elements: [], gridStyle: { paint } });
  const declarations = rule.slice(rule.indexOf("{") + 1, rule.lastIndexOf("}"));
  return Object.fromEntries(declarations.split(";").filter(line => line.includes(":")).map(line => {
    const index = line.indexOf(":");
    return [line.slice(0, index).trim().replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), line.slice(index + 1).trim()];
  }));
}

/** The serialized format uses only public, descriptive node fields. */
function fromEditorDocument(document: EditorFactoryDocument): FactoryDocument {
  const names = new Set<string>();
  const convert = (node: EditorFactoryNode): FactoryNode => {
    const style = node.style ?? {};
    let name = node.name.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || `node-${node.id}`;
    if (!/^[a-zA-Z_]/.test(name)) name = `node-${name}`;
    if (names.has(name)) name = `${name}-${node.id}`;
    names.add(name);
    const css: CSSProperties = { ...paintCss(style.paint), ...node.css };
    if (style.width !== undefined) css.width = style.width;
    if (style.height !== undefined) css.height = style.height;
    if (style.display !== undefined) css.display = style.display;
    if (["span", "p", "strong", "em", "small"].includes(node.tag) || /^h[1-6]$/.test(node.tag)) {
      if (style.color !== undefined && css.color === undefined) css.color = style.color;
      if (style.size !== undefined && css.fontSize === undefined) css.fontSize = style.size;
    }
    if (style.horizontalAlign) {
      if (node.layout || css.justifyItems !== undefined) css.justifyItems = style.horizontalAlign;
      else css.textAlign = style.horizontalAlign;
    }
    if (style.verticalAlign) {
      if (node.layout || css.alignItems !== undefined) css.alignItems = style.verticalAlign;
      else css.alignContent = style.verticalAlign;
    }
    // Legacy axis padding becomes ordinary custom declarations when needed.
    if (style.paddingX !== undefined || style.paddingY !== undefined) Object.assign(css, paddingCss(style));
    const padding = style.paddingAll === false ? style.paddingSides : style.padding ?? css.padding;
    const gap = style.gap ?? css.gap;
    if (padding !== undefined) delete css.padding;
    if (gap !== undefined) delete css.gap;
    const scrollX = style.scrollX ?? (css.overflowX === "auto" ? true : css.overflowX === "visible" ? false : undefined);
    const scrollY = style.scrollY ?? (css.overflowY === "auto" ? true : css.overflowY === "visible" ? false : undefined);
    if (scrollX !== undefined) delete css.overflowX;
    if (scrollY !== undefined) delete css.overflowY;
    if (node.kind === "area" && css.gridArea === node.area?.split("/").at(-1)) delete css.gridArea;
    return {
      tag: node.tag, name, id: node.id,
      container_class: node.container_class || undefined, action_class: node.atom_class || undefined, effect_class: node.effect_class || undefined,
      grid_type: node.layout?.grid, grid_area: node.kind === "area" ? node.area?.split("/").at(-1) ?? String(node.id) : undefined,
      grid_rows: node.layout?.rows, grid_cols: node.layout?.cols, grid_custom: node.layout?.custom, grid_spans: node.layout?.spans,
      scroll_x: scrollX, scroll_y: scrollY, padding: padding as FactoryNode["padding"], gap: gap as FactoryNode["gap"],
      css: Object.values(css).some(value => value !== undefined) ? css : undefined,
      text: node.text, href: node.href, disabled: node.disabled, states: node.states,
      children: node.children?.map(convert) ?? [],
    };
  };
  return { ...document, root: convert(document.root) };
}

export const treeToComposition = (document: FactoryDocument) => editorToComposition(toEditorDocument(document));
export const compositionToTree = (composition: FactoryComposition, previous?: FactoryDocument) =>
  fromEditorDocument(compositionToEditor(composition, previous ? toEditorDocument(previous) : undefined));

export function readComposition(input?: FactoryDocument | FactoryNode | FactoryComposition | string): FactoryDocument {
  const data = typeof input === "string" ? JSON.parse(input) : input;
  if (!data) return compositionToTree({ grid: "holy-grail", frame: defaultFrame, elements: [] });
  let document: FactoryDocument;
  if ("elements" in data) {
    if (!Array.isArray(data.elements) || !(data.grid in gridTypes)) throw Error("Invalid composition JSON.");
    document = compositionToTree(data);
  } else {
    const wrapped = "root" in data ? structuredClone(data) : { version: 2 as const, name: data.name, root: structuredClone(data) };
    const legacy = (node: Record<string, unknown>): boolean => Boolean(node.kind || node.layout || node.style || node.atom_class || (Array.isArray(node.children) && node.children.some(legacy)));
    document = legacy(wrapped.root as unknown as Record<string, unknown>) ? fromEditorDocument(wrapped as unknown as EditorFactoryDocument) : wrapped as FactoryDocument;
  }
  const { errors } = validateComposition(document);
  if (errors.length) throw Error(errors[0].message);
  const assignIds = (node: FactoryNode) => {
    if (node.id !== undefined) nextId = Math.max(nextId, node.id);
    node.children?.forEach(assignIds);
  };
  assignIds(document.root);
  const fillIds = (node: FactoryNode) => {
    node.id ??= id();
    node.children?.forEach(fillIds);
  };
  fillIds(document.root);
  return { ...document, version: 2 };
}
