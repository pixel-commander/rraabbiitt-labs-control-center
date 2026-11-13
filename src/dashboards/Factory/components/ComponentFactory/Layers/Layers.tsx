import { CodeChevrons } from "../../../../../icons/CodeChevrons";
import { FolderTree } from "../../../../../components/FolderTree/FolderTree";
import type { FolderTreeNode } from "../../../../../components/FolderTree/FolderTree.types";
import type { EditorFactoryNode } from "../ComponentFactory.types";
import type { LayersProps } from "./Layers.types";
import "./css/layers.css";

export const Layers = ({ editor, className }: LayersProps) => {
  const { composition, selected } = editor;

  const selectLayer = new Map<string, () => void>([["shell", editor.selectFrame]]);
  const selectedPath = selected ? `element:${selected.id}` : editor.area !== undefined ? `area:${editor.area}` : editor.frameSelected ? "shell" : undefined;

  const layer = (node: EditorFactoryNode): FolderTreeNode => {
    const key = node.area ?? String(node.id);
    const path = node.kind === "area" ? `area:${key}` : `element:${node.id}`;
    const element = composition.elements.find(item => item.id === node.id);
    selectLayer.set(path, () => editor.selectArea(node.kind === "area" ? key : element?.area ?? "main", node.kind === "area" ? undefined : node.id, false));
    return { name: node.name, path, children: node.children?.map(layer) };
  };
  const children = editor.renderDocument.root.children?.map(layer);

  return (
    <div data-grid="header-main" className={["component-factory-layers-pane", className].filter(Boolean).join(" ")}>
      <header data-area="header" className="pad-md">Layers</header>
      <div data-area="main" data-rows="1" data-cols="1">
        <div className="inner scroll-y pad-md">
          <FolderTree
            title="Composition layers"
            items={[{
              name: editor.renderDocument.root.name,
              path: "shell",
              children,
            }]}
            selected={selectedPath}
            always_open
            auto_size={false}
            fileIcon={<CodeChevrons />}
            folderIcon={<CodeChevrons />}
            handleClick={(item) => {
              if (item) selectLayer.get(item.path)?.();
            }}
          />
        </div>
      </div>
    </div>
  );
};
