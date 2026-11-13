import type { CSSProperties } from "react";
import type { FolderTreeProps } from "./FolderTree.types";
import { TreeItem } from "./TreeItem/TreeItem";
import { useFolderTree } from "./hooks/useFolderTree/useFolderTree";
import "./css/folder-tree.css";

export const FolderTree = (props: FolderTreeProps) => {
  const {
    items = [],
    selected,
    handleClick,
    icons,
    colors,
    fileIcon = (
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        height="1em"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <path d="M5 2.5h6l4 4v11H5z" />
        <path d="M11 2.5v4h4" />
      </svg>
    ),
    folderIcon = (
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        height="1em"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <path d="M2 5h6l2 2h8v9H2z" />
      </svg>
    ),
    className = "",
    children,
  } = props;
  const { isOpen, toggle, onKeyDown, containerRef, measuring, measuredWidth } =
    useFolderTree(props);
  return (
    <div
      className={[
        "folder-tree",
        measuring ? "folder-tree--measuring" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onKeyDown={onKeyDown}
      ref={containerRef}
      aria-hidden={measuring || undefined}
      inert={measuring}
      style={
        {
          "--folder-tree-auto-width":
            measuredWidth === undefined ? undefined : `${measuredWidth}px`,
        } as CSSProperties
      }
    >
      <ul
        className="folder-tree__items"
        aria-label={props.title ?? "Folder tree"}
      >
        {items.map((item) => (
          <TreeItem
            key={item.path}
            item={item}
            selected={selected}
            icons={icons}
            colors={colors}
            fileIcon={fileIcon}
            folderIcon={folderIcon}
            isOpen={measuring ? () => true : isOpen}
            toggle={toggle}
            handleClick={handleClick}
          />
        ))}
      </ul>
      {children}
    </div>
  );
};
