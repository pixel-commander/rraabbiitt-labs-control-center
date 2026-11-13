import { useLayoutEffect, useRef } from "react";
import type { HandlerKey } from "../../../HouseKeys.types";
export function useDesignerTabs(initial: string, content?: unknown) {
  const root = useRef<HTMLElement>(null),
    active = useRef(initial);
  const show = () => {
    root.current
      ?.querySelectorAll<HTMLElement>("[data-panel]")
      .forEach(
        (panel) =>
          (panel.hidden = !panel.dataset.panel
            ?.split(" ")
            .includes(active.current)),
      );
    root.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      .forEach((tab) => {
        const selected = tab.dataset.tab === active.current;
        tab.setAttribute("aria-selected", String(selected));
        tab.classList.toggle("is-selected", selected);
        tab.tabIndex = selected ? 0 : -1;
      });
  };
  const handleTab: HandlerKey<{ value: string }, "tab", void> = (data) => {
    if (!data) return;
    const { value } = data;
    active.current = value;
    show();
  };
  useLayoutEffect(show, [content]);
  return { root, handleTab };
}
