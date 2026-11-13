import { CodeChevrons } from "../../../../../icons/CodeChevrons";
import { FolderTree } from "../../../../../components/FolderTree/FolderTree";
import type { FolderTreeNode } from "../../../../../components/FolderTree/FolderTree.types";
import { gridTypes } from "../../../../../components/GridLayoutDisplay/GridLayoutDisplay.types";
import type { FactoryGridLayout } from "../ComponentFactory.types";
import { layoutCells, rootCells } from "../js/gridSlots";
import type { LayersProps } from "./Layers.types";
import "./css/layers.css";

export const Layers = ({ editor, className }: LayersProps) => {
  const { composition, selected } = editor;
  const areas = gridTypes[composition.grid];
  const layout = composition.gridStyle?.gridLayout ?? { grid: composition.grid };

  const selectLayer = new Map<string, () => void>([["shell", editor.selectFrame]]);
  const selectedPath = selected ? `element:${selected.id}` : editor.area !== undefined ? `area:${editor.area}` : editor.frameSelected ? "shell" : undefined;

  const cellLayer = (key: string, name: string, inherited: FolderTreeNode[] = []): FolderTreeNode => {
    const ownItems = composition.elements.filter((item) => item.area === key).map((item) => {
      const path = `element:${item.id}`;
      selectLayer.set(path, () => editor.selectArea(key, item.id, false));
      return {
        name: item.text || item.layoutTag || item.type,
        path,
        children: item.gridLayout ? slotLayers(item.gridLayout, String(item.id)) : undefined,
      };
    });
    const children = [...inherited, ...ownItems];
    const cellLayout = composition.areaStyles?.[key]?.gridLayout;
    const layers = cellLayout ? slotLayers(cellLayout, key, children) : children;
    const path = `area:${key}`;
    selectLayer.set(path, () => editor.selectArea(key, undefined, false));
    return { name, path, children: layers.length ? layers : undefined };
  };

  const slotLayers = (layout: FactoryGridLayout, owner: string, inherited: FolderTreeNode[] = []) =>
    layoutCells(layout, owner).map((cell) =>
      cellLayer(cell.key, cell.label, cell.receivesContent ? inherited : []),
    );

  const children = rootCells(layout, areas).map((cell) =>
    cellLayer(cell.key, cell.label, cell.inheritedAreas?.map((area) => cellLayer(area, area))),
  );

  return (
    <div data-grid="header-main" className={["component-factory-layers-pane", className].filter(Boolean).join(" ")}>
      <header data-area="header" className="pad-md">Layers</header>
      <div data-area="main" data-rows="1" data-cols="1">
        <div className="inner scroll-y pad-md">
          <FolderTree
            title="Composition layers"
            items={[{
              name: layout.grid ?? (layout.custom ? "Custom grid" : "Grid"),
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
