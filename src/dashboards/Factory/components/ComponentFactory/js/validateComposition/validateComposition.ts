import { gridTypes } from "../../../../../../components/GridLayoutDisplay/GridLayoutDisplay.types";
import type { CompositionValidationError, CompositionValidationResult } from "./validateComposition.types";

const fields = new Set(["tag", "name", "id", "container_class", "action_class", "effect_class", "grid_type", "grid_area", "grid_rows", "grid_cols", "scroll_x", "scroll_y", "padding", "gap", "css", "text", "href", "disabled", "grid_custom", "grid_spans", "states", "children"]);
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);

/** Validate public nested composition JSON. Does not change the supplied value. */
export function validateComposition(composition: unknown): CompositionValidationResult {
  const errors: CompositionValidationError[] = [];
  const summary: CompositionValidationResult["summary"] = { nodes: 0, tags: {}, classes: {}, css: {}, grids: {}, display: {} };
  const count = (counts: Record<string, number>, key: string) => { Object.defineProperty(counts, key, { value: (Object.hasOwn(counts, key) ? counts[key] : 0) + 1, writable: true, enumerable: true, configurable: true }); };
  const result = (): CompositionValidationResult => ({ error_count: errors.length, errors, summary });
  const error = (path: string, message: string) => { errors.push({ path, message }); };
  let data = composition;
  if (typeof data === "string") {
    try { data = JSON.parse(data); }
    catch { error("$", "Invalid composition JSON."); return result(); }
  }
  if (!object(data)) { error("$", "Composition must be a JSON object."); return result(); }
  const wrapped = "root" in data;
  if (wrapped && data.version !== undefined && data.version !== 2) error("version", "Composition version must be 2.");
  const ids = new Set<number>(), names = new Set<string>(), ancestors = new Set<object>();
  const visit = (value: unknown, path: string) => {
    if (!object(value)) { error(path, "Invalid composition node."); return; }
    if (ancestors.has(value)) { error(path, "Composition children must not contain a cycle."); return; }
    ancestors.add(value);
    summary.nodes++;
    if (typeof value.tag === "string") count(summary.tags, value.tag);
    const classes = new Set<string>();
    if (typeof value.name === "string") classes.add(value.name);
    for (const key of ["container_class", "action_class", "effect_class"]) if (typeof value[key] === "string") value[key].split(/\s+/).filter(Boolean).forEach(token => classes.add(token));
    classes.forEach(token => count(summary.classes, token));
    const css = object(value.css) ? value.css : {};
    const properties = new Set(Object.keys(css));
    if (value.padding !== undefined) properties.add("padding");
    if (value.gap !== undefined) properties.add("gap");
    properties.forEach(property => count(summary.css, property));
    if (typeof value.grid_type === "string") count(summary.grids, value.grid_type);
    if (typeof css.display === "string") count(summary.display, css.display);
    if (typeof value.name !== "string" || !/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(value.name)) error(`${path}.name`, "Node names must be valid CSS class names.");
    else if (names.has(value.name)) error(`${path}.name`, `Duplicate node name: ${value.name}. Names identify CSS rules and must be unique.`);
    else names.add(value.name);
    if (typeof value.tag !== "string" || !/^(article|aside|div|footer|header|main|nav|section|span|h[1-6]|button|a|p|strong|em|small|ul|ol|li)$/.test(value.tag)) error(`${path}.tag`, "Invalid composition node tag.");
    if (value.id !== undefined) {
      if (typeof value.id !== "number" || !Number.isSafeInteger(value.id) || value.id < 1 || ids.has(value.id)) error(`${path}.id`, "Composition node IDs must be unique positive integers.");
      else ids.add(value.id);
    }
    if (value.grid_type !== undefined && (typeof value.grid_type !== "string" || !Object.hasOwn(gridTypes, value.grid_type))) error(`${path}.grid_type`, "Unknown composition grid.");
    for (const key of ["grid_rows", "grid_cols"]) if (value[key] !== undefined && (typeof value[key] !== "number" || !Number.isSafeInteger(value[key]) || (value[key] as number) < 1 || (value[key] as number) > 12)) error(`${path}.${key}`, "Grid rows and cols must be integers from 1 to 12.");
    for (const key of ["scroll_x", "scroll_y", "disabled"]) if (value[key] !== undefined && typeof value[key] !== "boolean") error(`${path}.${key}`, `${key} must be a boolean.`);
    if (value.css !== undefined && !object(value.css)) error(`${path}.css`, "css must be a property object.");
    for (const key of Object.keys(value)) if (!fields.has(key)) error(`${path}.${key}`, `Unknown node field: ${key}.`);
    if (value.grid_area !== undefined && (typeof value.grid_area !== "string" || !value.grid_area || value.grid_area.includes("/"))) error(`${path}.grid_area`, "grid_area must be a local area name, without parent paths.");
    for (const key of ["container_class", "action_class", "effect_class", "text", "href"]) if (value[key] !== undefined && typeof value[key] !== "string") error(`${path}.${key}`, `${key} must be a string.`);
    if (value.gap !== undefined && typeof value.gap !== "string" && typeof value.gap !== "number") error(`${path}.gap`, "gap must be a token, CSS length, or number.");
    if (value.children !== undefined && !Array.isArray(value.children)) error(`${path}.children`, "Node children must be an array.");
    if (Array.isArray(value.children)) {
      const areas = new Set<string>();
      value.children.forEach((child, index) => {
        const childPath = `${path}.children[${index}]`;
        if (object(child) && typeof child.grid_area === "string") {
          if (areas.has(child.grid_area)) error(`${childPath}.grid_area`, "Sibling grid_area values must be unique.");
          areas.add(child.grid_area);
        }
        visit(child, childPath);
      });
    }
    ancestors.delete(value);
  };
  visit(wrapped ? data.root : data, wrapped ? "root" : "$");
  return result();
}
