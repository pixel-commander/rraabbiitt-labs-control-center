import type { ReactNode, JSX } from "react";
import type { HouseKeys, PathsProps, HandlerKey } from "../../HouseKeys.types";

export interface FolderTreeNode extends PathsProps {
  name: string;
  path: string;
  type?: string;
  children?: FolderTreeNode[];
  Icon?: JSX.Element;
  color?: string;
  icon?: ReactNode;
  expandedIcon?: ReactNode;
}
export interface FolderTreeProps extends HouseKeys {
  items?: FolderTreeNode[];
  selected?: string;
  start_state?: "open" | "collapsed";
  always_open?: boolean;
  auto_size?: boolean;
  icons?: Record<string, ReactNode>;
  colors?: Record<string, string>;
  fileIcon?: ReactNode;
  folderIcon?: ReactNode;
  handleClick?: HandlerKey<FolderTreeNode, "file" | "folder", void>;
  children?: ReactNode;
  className?: string;
}
