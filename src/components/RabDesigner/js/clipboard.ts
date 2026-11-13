import type {
  DesignerDocument,
  DesignerElement,
} from "../RABDesigner.types.ts";
import { locate, updateNodes } from "./document.ts";
import { validateDocument } from "./validation.mjs";
export const clipboardType = "application/x-rab-designer+json";
interface ClipboardItem {
  application: "rab-designer";
  schema: 1;
  mode: "copy" | "cut";
  source: number;
  parent?: number;
  x: number;
  y: number;
  document: DesignerDocument;
}
function parentOf(
  nodes: DesignerElement[],
  id: number,
  parent?: DesignerElement,
): DesignerElement | undefined {
  for (const node of nodes) {
    if (node.id === id) return parent;
    const found = parentOf(node.children, id, node);
    if (found) return found;
  }
}
export function copyObject(
  data: DesignerDocument,
  id: number,
  mode: "copy" | "cut",
) {
  const found = locate(data.children, id);
  if (!found) return undefined;
  const item: ClipboardItem = {
    application: "rab-designer",
    schema: 1,
    mode,
    source: data.id,
    parent: parentOf(data.children, id)?.id,
    x: found.x,
    y: found.y,
    document: {
      schema: 1,
      id: data.id,
      title: data.title,
      theme: data.theme,
      mode: data.mode,
      classes: data.classes,
      children: [found.node],
    },
  };
  validateDocument(JSON.parse(JSON.stringify(item.document)));
  const text = JSON.stringify(item);
  if (text.length > 2000000) throw Error("Clipboard item exceeds 2 MB.");
  return text;
}
export function pasteObject(data: DesignerDocument, text: string) {
  if (text.length > 2000000) throw Error("Clipboard item exceeds 2 MB.");
  let item: ClipboardItem;
  try {
    item = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (!item || item.application !== "rab-designer") return undefined;
  if (
    item.schema !== 1 ||
    !["copy", "cut"].includes(item.mode) ||
    !Number.isSafeInteger(item.source) ||
    ![item.x, item.y].every(
      (n) =>
        typeof n === "number" && Number.isFinite(n) && Math.abs(n) <= 100000,
    ) ||
    (item.parent !== undefined && !Number.isSafeInteger(item.parent))
  )
    throw Error("Invalid designer clipboard item.");
  const source = validateDocument(item.document);
  if (source.children.length !== 1)
    throw Error("Copy one object or parent group at a time.");
  const parent =
    item.source === data.id && item.parent !== undefined
      ? locate(data.children, item.parent)?.node
      : undefined;
  const siblings = parent?.children ?? data.children;
  const root = source.children[0];
  let x = parent ? root.x : item.x,
    y = parent ? root.y : item.y;
  if (item.mode === "copy") {
    x += 20;
    y += 20;
  }
  while (siblings.some((node) => node.x === x && node.y === y)) {
    x += 20;
    y += 20;
  }
  const used = new Set<number>();
  const collect = (nodes: DesignerElement[]) =>
    nodes.forEach((n) => {
      used.add(n.id);
      collect(n.children);
    });
  collect(data.children);
  collect(source.children);
  const clone = (node: DesignerElement): DesignerElement => {
    let id = Date.now();
    while (used.has(id)) id++;
    used.add(id);
    return { ...structuredClone(node), id, children: node.children.map(clone) };
  };
  const classes = structuredClone(data.classes ?? {}),
    renames = new Map<string, string>();
  if (data.mode === "dev")
    for (const [name, definition] of Object.entries(source.classes ?? {})) {
      if (item.source === data.id && classes[name]) {
        renames.set(name, name);
        continue;
      }
      let target = name,
        index = 2;
      while (
        classes[target] &&
        JSON.stringify(classes[target]) !== JSON.stringify(definition)
      )
        target = `${name.slice(0, 65)}-${index++}`;
      renames.set(name, target);
      classes[target] = definition;
    }
  const relink = (node: DesignerElement): DesignerElement => ({
    ...node,
    className: node.className
      ? (renames.get(node.className) ?? node.className)
      : undefined,
    children: node.children.map(relink),
  });
  const pasted = { ...relink(clone(root)), x, y };
  const next = {
    ...data,
    ...(data.mode === "dev" ? { classes } : {}),
    children: parent
      ? updateNodes(data.children, parent.id, {
          children: [...parent.children, pasted],
        })
      : [...data.children, pasted],
    ...(source.theme ? { theme: { ...source.theme, ...data.theme } } : {}),
  };
  const normalized = validateDocument(JSON.parse(JSON.stringify(next)));
  return { data: normalized, node: pasted };
}
