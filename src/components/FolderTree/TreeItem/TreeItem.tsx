import type { CSSProperties } from "react";
import type { TreeItemProps } from "./TreeItem.types";
import "./css/tree-item.css";

export const TreeItem = ({
  item,
  selected,
  icons,
  colors,
  fileIcon,
  folderIcon,
  isOpen,
  toggle,
  handleClick,
}: TreeItemProps) => {
  const folder =
    item.type === "folder" ||
    (item.type !== "file" && item.children !== undefined);
  const open = folder && isOpen(item.path);
  const type = item.type ?? (folder ? "folder" : "file");
  const mappedIcon =
    icons && Object.hasOwn(icons, type)
      ? icons[type]
      : folder
        ? folderIcon
        : fileIcon;
  const icon =
    item.Icon !== undefined
      ? item.Icon
      : open && item.expandedIcon !== undefined
        ? item.expandedIcon
        : item.icon !== undefined
          ? item.icon
          : mappedIcon;
  return (
    <li className="tree-item">
      <button
        type="button"
        data-grid="side-left"
        data-path={item.path}
        className={`folder-tree__row${selected === item.path ? " is-selected" : ""}`}
        style={item.color !== undefined ? { color: item.color } : undefined}
        aria-current={selected === item.path ? "true" : undefined}
        aria-expanded={folder ? open : undefined}
        onClick={() => {
          if (folder) toggle(item.path);
          handleClick?.(item, folder ? "folder" : "file");
        }}
      >
        <span
          data-area="side"
          className="tree-item__icons"
          style={
            {
              "--tree-item-icon-color": item.color ?? colors?.[type],
            } as CSSProperties
          }
          aria-hidden="true"
        >
          {icon ?? null}
        </span>
        <span data-area="main" className="tree-item__name">
          {item.name}
        </span>
      </button>
      {folder && open && (
        <ul className="tree-item__children">
          {(item.children ?? []).map((child) => (
            <TreeItem
              key={child.path}
              item={child}
              selected={selected}
              icons={icons}
              colors={colors}
              fileIcon={fileIcon}
              folderIcon={folderIcon}
              isOpen={isOpen}
              toggle={toggle}
              handleClick={handleClick}
            />
          ))}
        </ul>
      )}
    </li>
  );
};
