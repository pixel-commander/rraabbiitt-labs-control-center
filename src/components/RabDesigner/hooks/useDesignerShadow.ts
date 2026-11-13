import { useRef, useLayoutEffect } from "react";
import { parseShadow } from "../js/shadows";
export function useDesignerShadow(value: string) {
  const root = useRef<HTMLDivElement>(null);
  const shadow = parseShadow(value);
  useLayoutEffect(() => {
    root.current
      ?.querySelectorAll<HTMLInputElement>("[data-shadow-field]")
      .forEach((input) => {
        if (document.activeElement === input) return;
        const key = input.dataset.shadowField as keyof typeof shadow;
        if (input.type === "checkbox") input.checked = Boolean(shadow[key]);
        else input.value = String(shadow[key]);
      });
  }, [value]);
  return { root, shadow };
}
