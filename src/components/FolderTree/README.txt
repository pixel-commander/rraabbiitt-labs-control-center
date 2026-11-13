FolderTree
==========

Recursive folder/file list with controlled selection, expansion and custom React icons.

Implementation: FolderTree.tsx
Exports: FolderTree

Render this component with the props below. Application data and persistence remain with the caller.

Customization
-------------
UI classes can be overridden via theme tokens, component tokens, supplied className/container_class/cell_class/event_class props where exposed, or CSS in a parent/external stylesheet. Use only the class props declared by this implementation. The component base class stays in place. An omitted container_class uses the implementation default; an empty string deliberately removes that default. Parent CSS can target the component base class and its documented child classes. Put stylesheet overrides after defaults or in the overrides layer. Tokens must be applied to the component element when it defines its own defaults. Plain functions do not render containers; style the elements supplied to them.

Sizing
------
The caller supplies available layout space. Scroll regions require a bounded grid track and min-block-size: 0. Preview-only dimensions belong in demo files, not reusable component defaults.

Public types
------------
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


Usage skill
-----------
schema: 1
intent: use
id: 1793993518462
name: FolderTree
path: src/components/FolderTree
file: FolderTree.tsx
owner:
  id: 1793993362977
  path: src/components/FolderTree
  file: rab.settings.json
implementation:
  - path: src/components/FolderTree
    file: FolderTree.tsx
instructions: "Render FolderTree with items: FolderTreeNode[]. Each node
  requires name and a unique path; children recursively contains further nodes
  without a fixed depth limit. type=folder marks empty folders, and type=file
  marks files; supplying children also identifies a folder. icon and
  expandedIcon accept custom ReactNode per node; fileIcon/folderIcon supply
  default icons, and null hides an icon. selected is the controlled selected
  path. handleClick receives the original node and a file or folder action; the
  parent updates selected. start_state is open or collapsed (default collapsed)
  for folder expansion. Returns an expandable file/folder list, with keyboard
  arrow/Home/End navigation and native button activation. No filesystem access
  or network loading."

Set always_open to true to keep every branch expanded while allowing selection.
It defaults to false.

# Per-item overrides: Icon (JSX.Element) overrides icon maps; color overrides the row and icon color.
