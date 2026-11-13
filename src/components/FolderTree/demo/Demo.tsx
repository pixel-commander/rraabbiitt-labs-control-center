import { useState } from "react";
import { FolderTree } from "../FolderTree";
import type { FolderTreeNode } from "../FolderTree.types";

const items: FolderTreeNode[] = [
  {
    name: "src",
    path: "src",
    type: "folder",
    children: [
      {
        name: "components",
        path: "src/components",
        children: [
          {
            name: "FolderTree",
            path: "src/components/FolderTree",
            children: [
              {
                name: "FolderTree.tsx",
                path: "src/components/FolderTree/FolderTree.tsx",
                type: "tsx",
              },
              {
                name: "css",
                path: "src/components/FolderTree/css",
                children: [
                  {
                    name: "folder-tree.css",
                    path: "src/components/FolderTree/css/folder-tree.css",
                    type: "css",
                  },
                ],
              },
            ],
          },
        ],
      },
      { name: "main.tsx", path: "src/main.tsx", type: "tsx" },
    ],
  },
  { name: "empty-folder", path: "empty-folder", type: "folder", children: [] },
  {
    name: "README.md",
    path: "README.md",
    type: "md",
    color: "var(--accent-secondary)",
  },
];

export const Demo = () => {
  const [selected, setSelected] = useState("src/main.tsx");
  return (
    <div>
      <FolderTree
        items={items}
        selected={selected}
        start_state="open"
        colors={{
          folder: "var(--content-muted)",
          tsx: "var(--accent-secondary)",
          css: "var(--accent-default)",
          md: "var(--content-muted)",
        }}
        handleClick={(item, type) => {
          if (item && type === "file") setSelected(item.path);
        }}
      />
    </div>
  );
};
