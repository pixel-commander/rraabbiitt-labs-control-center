import { useState, useRef, useLayoutEffect } from "react";
import type { KeyboardEvent } from "react";
import type { FolderTreeProps } from "../../FolderTree.types";

export const useFolderTree = (props: FolderTreeProps) => {
  const { start_state = "collapsed", auto_size = true, always_open = false } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [measurement, setMeasurement] = useState<{
    items: FolderTreeProps["items"];
    icons: FolderTreeProps["icons"];
    fileIcon: FolderTreeProps["fileIcon"];
    folderIcon: FolderTreeProps["folderIcon"];
    width: number;
  } | null>(null);
  const measuring =
    auto_size &&
    (measurement === null ||
      measurement.items !== props.items ||
      measurement.icons !== props.icons ||
      measurement.fileIcon !== props.fileIcon ||
      measurement.folderIcon !== props.folderIcon);
  useLayoutEffect(() => {
    if (!measuring || !containerRef.current) return;
    const width = Math.ceil(containerRef.current.getBoundingClientRect().width);
    setMeasurement({
      items: props.items,
      icons: props.icons,
      fileIcon: props.fileIcon,
      folderIcon: props.folderIcon,
      width,
    });
  }, [measuring, props.items, props.icons, props.fileIcon, props.folderIcon]);
  const [expanded, setExpanded] = useState<Map<string, boolean>>(
    () => new Map(),
  );
  const isOpen = (path: string) =>
    always_open || (expanded.get(path) ?? start_state === "open");
  const toggle = (path: string) => {
    if (always_open) return;
    setExpanded((previous) => {
      const next = new Map(previous);
      next.set(path, !(previous.get(path) ?? start_state === "open"));
      return next;
    });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
      ".folder-tree__row",
    );
    if (!target) return;
    const rows = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        ".folder-tree__row",
      ),
    );
    const index = rows.indexOf(target);
    const key = event.key;
    if (
      key === "ArrowDown" ||
      key === "ArrowUp" ||
      key === "Home" ||
      key === "End"
    ) {
      event.preventDefault();
      const next =
        key === "Home"
          ? 0
          : key === "End"
            ? rows.length - 1
            : Math.max(
                0,
                Math.min(
                  rows.length - 1,
                  index + (key === "ArrowDown" ? 1 : -1),
                ),
              );
      rows[next]?.focus();
    } else if (key === "ArrowRight") {
      event.preventDefault();
      if (target.getAttribute("aria-expanded") === "false")
        toggle(target.dataset.path!);
      else if (target.getAttribute("aria-expanded") === "true")
        rows[index + 1]?.focus();
    } else if (key === "ArrowLeft") {
      event.preventDefault();
      if (!always_open && target.getAttribute("aria-expanded") === "true")
        toggle(target.dataset.path!);
      else
        target
          .closest("li")
          ?.parentElement?.closest("li")
          ?.querySelector<HTMLButtonElement>(".folder-tree__row")
          ?.focus();
    }
  };
  return {
    isOpen,
    toggle,
    onKeyDown,
    containerRef,
    measuring,
    measuredWidth: auto_size ? measurement?.width : undefined,
  };
};
