import type { PathsProps } from "../../HouseKeys.types";
import type { FolderTreeNode } from "../../components/FolderTree/FolderTree.types";

export const settingsPathsToTree = (
  paths: PathsProps[] = [],
): FolderTreeNode[] => {
  const roots: FolderTreeNode[] = [];
  const folders = new Map<string, FolderTreeNode>();
  const files = new Set<string>();
  for (const entry of paths) {
    const name = entry.file ?? entry.name;
    if (!name) continue;
    const parts = (entry.path ?? ".")
      .replaceAll("\\", "/")
      .split("/")
      .filter((part) => part && part !== ".");
    let children = roots;
    let folderPath = "";
    for (const part of parts) {
      folderPath = folderPath ? `${folderPath}/${part}` : part;
      let folder = folders.get(folderPath);
      if (!folder) {
        folder = { name: part, path: folderPath, type: "folder", children: [] };
        folders.set(folderPath, folder);
        children.push(folder);
      }
      children = folder.children!;
    }
    const path = folderPath ? `${folderPath}/${name}` : name;
    if (!files.has(path)) {
      children.push({
        ...entry,
        name,
        path,
        type: entry.type ?? name.split(".").slice(1).at(-1) ?? "file",
      });
      files.add(path);
    }
  }
  const sort = (items: FolderTreeNode[]) => {
    items.sort(
      (a, b) =>
        Number(b.type === "folder") - Number(a.type === "folder") ||
        a.name.localeCompare(b.name),
    );
    for (const item of items) if (item.children) sort(item.children);
  };
  sort(roots);
  return roots;
};
