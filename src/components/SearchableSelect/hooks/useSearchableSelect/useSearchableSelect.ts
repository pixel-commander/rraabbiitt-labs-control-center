import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import type {
  HandlerKey,
  HouseKeys,
  PathsProps,
} from "../../../../HouseKeys.types";
import type { SearchableSelectProps } from "../../SearchableSelect.types";

export const useSearchableSelect = (settings: SearchableSelectProps) => {
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  // Query state drives live list filtering; the input itself remains DOM-owned.
  const [query, setQuery] = useState("");
  const close = () => {
    const panel = root.current?.querySelector<HTMLElement>(
      "[data-select-panel]",
    );
    const stage = root.current?.querySelector<HTMLButtonElement>(
      "[data-select-stage]",
    );
    if (!panel || !stage || panel.hidden) return;
    if (panel.contains(document.activeElement)) stage.focus();
    panel.hidden = true;
    stage.setAttribute("aria-expanded", "false");
    const input = panel.querySelector<HTMLInputElement>('input[type="search"]');
    const hadQuery = Boolean(input?.value);
    if (input) input.value = "";
    setQuery("");
    if (hadQuery) {
      const current = settingsRef.current;
      void current.handleChange?.({ query: "" }, "searchable-select", {
        ...current,
      });
    }
  };
  const position = () => {
    const panel = root.current?.querySelector<HTMLElement>(
      "[data-select-panel]",
    );
    const stage = root.current?.querySelector<HTMLButtonElement>(
      "[data-select-stage]",
    );
    if (!panel || !stage || panel.hidden) return;
    const rect = stage.getBoundingClientRect(),
      origin = root.current!.getBoundingClientRect();
    const margin = 8,
      gap = 6;
    let top = margin,
      bottom = window.innerHeight - margin;
    for (
      let parent = root.current!.parentElement;
      parent;
      parent = parent.parentElement
    ) {
      if (
        /(auto|scroll|hidden|clip)/.test(getComputedStyle(parent).overflowY)
      ) {
        const bounds = parent.getBoundingClientRect();
        top = Math.max(top, bounds.top);
        bottom = Math.min(bottom, bounds.bottom);
      }
    }
    const below = Math.max(0, bottom - rect.bottom - gap);
    const above = Math.max(0, rect.top - top - gap);
    panel.style.maxHeight = `${Math.max(above, below)}px`;
    const upward =
      below < panel.getBoundingClientRect().height && above > below;
    panel.style.maxHeight = `${upward ? above : below}px`;
    panel.style.top = upward ? "auto" : `${rect.bottom - origin.top + gap}px`;
    panel.style.bottom = upward
      ? `${origin.bottom - rect.top + gap}px`
      : "auto";
  };
  useLayoutEffect(() => {
    position();
  });
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        close();
    };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, []);
  const handleToggle = () => {
    const panel = root.current?.querySelector<HTMLElement>(
      "[data-select-panel]",
    );
    const stage = root.current?.querySelector<HTMLButtonElement>(
      "[data-select-stage]",
    );
    if (!panel || !stage) return;
    if (!panel.hidden) {
      close();
      return;
    }
    panel.hidden = false;
    position();
    stage.setAttribute("aria-expanded", "true");
    panel
      .querySelector<HTMLInputElement>('input[type="search"]')
      ?.focus({ preventScroll: true });
  };
  const handleClick: HandlerKey<
    HouseKeys & PathsProps,
    "searchable-select",
    void
  > = (data, type = "searchable-select", props) => {
    settings.handleClick?.(data, type, props ?? { ...settings });
    close();
  };
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const query = event.currentTarget.value;
    setQuery(query);
    void settings.handleChange?.({ query }, "searchable-select", {
      ...settings,
    });
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const options = Array.from(
        root.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ??
          [],
      );
      if (!options.length) return;
      event.preventDefault();
      const index = options.indexOf(
        document.activeElement as HTMLButtonElement,
      );
      options[
        (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) %
          options.length
      ]?.focus();
    }
  };
  const data = settings.data ?? [];
  const matches = settings.handleChange
    ? data
    : data.filter((record) =>
        [record.name, record.title, record.description].some((value) =>
          value?.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
        ),
      );
  return {
    root,
    id,
    matches,
    handleToggle,
    handleClick,
    handleInput,
    handleKeyDown,
  };
};
