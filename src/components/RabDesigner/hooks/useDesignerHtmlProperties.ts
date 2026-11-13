import { useRef, useLayoutEffect } from "react";
import type { FormEvent } from "react";
import type { DesignerHtmlPropertiesProps } from "../components/DesignerHtmlProperties/DesignerHtmlProperties.types";
import type { DesignerElement } from "../RABDesigner.types";
import {
  layoutOptions,
  layoutLengths,
  renameClass,
  validLayoutLength,
  allowsWidth,
  resolveElement,
} from "../js/htmlModel";
import { updateNodes } from "../js/document";
export function useDesignerHtmlProperties(props: DesignerHtmlPropertiesProps) {
  const form = useRef<HTMLFormElement>(null),
    status = useRef<HTMLOutputElement>(null),
    node = props.node;
  const display = node.layout?.display ?? (node.grid ? "grid" : "block");
  const parentOf = (nodes: DesignerElement[]): DesignerElement | undefined => {
    for (const item of nodes) {
      if (item.children.some((child) => child.id === node.id))
        return resolveElement(props.data, item);
      const parent = parentOf(item.children);
      if (parent) return parent;
    }
  };
  const parent = parentOf(props.data.children),
    flexItem = parent?.layout?.display === "flex";
  const showField = (key: string) =>
    node["data-grid"] &&
    [
      "display",
      "cols",
      "flexDirection",
      "flexWrap",
      "justifyContent",
      "alignItems",
    ].includes(key)
      ? false
      : ["flexDirection", "flexWrap"].includes(key)
        ? display === "flex"
        : ["justifyContent", "alignItems", "gap"].includes(key)
          ? display === "flex" || display === "grid"
          : key === "cols"
            ? display === "grid"
            : ["flexGrow", "flexShrink"].includes(key)
              ? flexItem
              : true;
  const values = {
    title: node.title,
    className: node.className ?? "",
    content: node.content,
    cols: node.cols ?? 2,
    gap: node.gap ?? 0,
    padding: node.padding ?? 0,
    fontSize: node.fontSize,
    fontWeight: node.fontWeight ?? 400,
    ...Object.fromEntries(
      Object.entries(layoutOptions).map(([key, options]) => [
        key,
        node.layout?.[key as keyof typeof node.layout] ?? options[0],
      ]),
    ),
    ...Object.fromEntries(
      layoutLengths.map((key) => [
        key,
        node.layout?.[key] ??
          (["width", "height"].includes(key)
            ? `${node[key as "width" | "height"]}px`
            : ""),
      ]),
    ),
    flexGrow: node.layout?.flexGrow ?? 0,
    flexShrink: node.layout?.flexShrink ?? 1,
    display,
  };
  useLayoutEffect(() => {
    for (const [key, value] of Object.entries(values)) {
      const field = form.current?.elements.namedItem(key);
      if (
        (field instanceof HTMLInputElement ||
          field instanceof HTMLSelectElement ||
          field instanceof HTMLTextAreaElement) &&
        document.activeElement !== field
      )
        field.value = String(value);
    }
  }, [node]);
  const apply = (event: FormEvent<HTMLFormElement>) => {
    const field = event.target;
    if (!(
      field instanceof HTMLInputElement ||
      field instanceof HTMLSelectElement ||
      field instanceof HTMLTextAreaElement
    ))
      return;
    field.setCustomValidity("");
    if (!field.checkValidity()) return;
    const values = new FormData(event.currentTarget),
      key = field.name,
      value = String(values.get(key) ?? "");
    try {
      if (key === "className") {
        props.handleChange(renameClass(props.data, node.id, value), "change", {
          ...props,
        });
        return;
      }
      let patch: Partial<DesignerElement>;
      if (
        key in layoutOptions ||
        layoutLengths.includes(key as (typeof layoutLengths)[number]) ||
        ["flexGrow", "flexShrink"].includes(key)
      ) {
        const property = key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
        if (
          value &&
          (!CSS.supports(property, value) ||
            (layoutLengths.includes(key as (typeof layoutLengths)[number]) &&
              !validLayoutLength(value)))
        )
          throw Error("Enter a valid CSS value.");
        if (
          ["width", "minWidth", "maxWidth"].includes(key) &&
          !allowsWidth(props.data.mode, node)
        )
          return;
        patch = {
          layout: {
            ...node.layout,
            [key]:
              value === ""
                ? undefined
                : ["flexGrow", "flexShrink"].includes(key)
                  ? Number(value)
                  : value,
          },
        };
        if (
          ["width", "height"].includes(key) &&
          /^\d+(?:\.\d+)?px$/.test(value)
        )
          patch[key as "width" | "height"] = Math.max(
            1,
            Math.min(10000, Number.parseFloat(value)),
          );
      } else
        patch = {
          [key]: ["cols", "gap", "padding", "fontSize", "fontWeight"].includes(
            key,
          )
            ? Number(value)
            : value,
        };
      props.handleChange(
        {
          ...props.data,
          children: updateNodes(props.data.children, node.id, patch),
        },
        "change",
        { ...props },
      );
      if (status.current) status.current.value = "";
    } catch (error) {
      field.setCustomValidity((error as Error).message);
      if (status.current) status.current.value = (error as Error).message;
    }
  };
  return { form, status, values, apply, showField };
}
