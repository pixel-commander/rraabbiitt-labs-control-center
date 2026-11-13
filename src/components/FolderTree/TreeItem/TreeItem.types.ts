import type { HouseKeys } from "../../../HouseKeys.types";
import type { ReactNode } from "react";
import type { FolderTreeNode, FolderTreeProps } from "../FolderTree.types";
export interface TreeItemProps extends HouseKeys {
  item: FolderTreeNode;
  selected?: string;
  icons?: FolderTreeProps["icons"];
  colors?: FolderTreeProps["colors"];
  fileIcon?: ReactNode;
  folderIcon?: ReactNode;
  isOpen: (path: string) => boolean;
  toggle: (path: string) => void;
  handleClick?: FolderTreeProps["handleClick"];
}
