import { useRef, useLayoutEffect } from "react";
import type { DesignerElement } from "../RABDesigner.types";
import { useDesignerTabs } from "./useDesignerTabs";
import type { DesignerState } from "../js/appearance";
export function useDesignerToolbar(
  selected?: DesignerElement,
  state: DesignerState = "normal",
) {
  const editor = useRef<HTMLFormElement>(null);
  const { root, handleTab } = useDesignerTabs("properties", selected);
  useLayoutEffect(() => {
    if (!selected || !editor.current) return;
    const values = {
      ...selected,
      width: Math.round(selected.width),
      height: Math.round(selected.height),
      grid: selected.grid ?? "free",
      tracks: selected.cols ?? selected.rows ?? 2,
      fontWeight: selected.fontWeight ?? 400,
      gap: selected.gap ?? "",
      padding: selected.padding ?? "",
      backgroundColor: selected.backgroundColor ?? "",
      borderColor: selected.borderColor ?? "",
      borderWidth: selected.borderWidth ?? "",
      borderRadius: selected.borderRadius ?? "",
      borderStyle: selected.borderStyle ?? "solid",
      boxShadow: selected.boxShadow ?? "none",
      opacity: (selected.opacity ?? 1) * 100,
    };
    const appearance = {
      ...selected.appearance?.normal,
      ...selected.appearance?.[state],
    };
    if (appearance["border-width"] !== undefined)
      values.borderWidth = Number.parseFloat(appearance["border-width"]);
    if (appearance["border-radius"] !== undefined)
      values.borderRadius = Number.parseFloat(appearance["border-radius"]);
    if (appearance["border-style"] !== undefined)
      values.borderStyle = appearance[
        "border-style"
      ] as DesignerElement["borderStyle"] & string;
    if (appearance.opacity !== undefined)
      values.opacity = Number(appearance.opacity) * 100;
    if (appearance["box-shadow"] !== undefined)
      (values as Record<string, unknown>).boxShadow =
        appearance["box-shadow"] === "none" ? "none" : "custom";
    for (const [key, value] of Object.entries(values)) {
      const field = editor.current.elements.namedItem(key);
      if (
        (field instanceof HTMLInputElement ||
          field instanceof HTMLSelectElement) &&
        document.activeElement !== field
      )
        field.value = String(value);
    }
  }, [selected, state]);
  return { editor, root, handleTab };
}
