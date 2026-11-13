import { useLayoutEffect, useRef } from "react";
import type { DesignerElement } from "../RABDesigner.types";
import type { DesignerState } from "../js/appearance";
export function useDesignerAppearance(
  selected: DesignerElement | undefined,
  state: DesignerState,
) {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    root.current
      ?.querySelectorAll<HTMLInputElement>("input[name]")
      .forEach((field) => {
        if (document.activeElement !== field)
          field.value =
            selected?.appearance?.[state]?.[
              field.name as keyof NonNullable<
                NonNullable<DesignerElement["appearance"]>["normal"]
              >
            ] ?? "";
      });
  }, [selected, state]);
  return root;
}
