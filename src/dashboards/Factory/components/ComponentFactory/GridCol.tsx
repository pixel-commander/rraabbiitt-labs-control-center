import { GridLayoutDisplay } from "../../../../components/GridLayoutDisplay/GridLayoutDisplay";
import type { FactoryEditorProps, FactoryGridLayout } from "./ComponentFactory.types";
import { Elements } from "./Elements/Elements";
import { GridAreaSelectPopup } from "./GridAreaSelectPopup/GridAreaSelectPopup";
import { SettingsCol } from "./SettingsCol/SettingsCol";
import { gridSlots } from "./js/gridSlots";

const gridTabs = ["Grid", "Layout"];

export const GridCol = ({ editor }: FactoryEditorProps) => {
  const { selected, area, composition } = editor;
  const shellSelected = editor.frameSelected;
  const hasSelection = shellSelected || area !== undefined;
  const shellLayout = composition.gridStyle?.gridLayout ?? { grid: composition.grid };
  const surface = area === undefined ? composition.gridStyle : composition.areaStyles?.[area];
  const layout = selected ? selected.gridLayout : shellSelected ? shellLayout : surface?.gridLayout;
  const updateGridLayout = (gridLayout?: FactoryGridLayout) => {
    if (selected) editor.updateElement({ gridLayout });
    else editor.updateSurface({ gridLayout });
  };
  return (
    <>
      <SettingsCol
        tabs={gridTabs}
        selected={editor.gridTab}
        handleClick={(item) => { if (item) editor.setGridTab(item.path); }}
        footer={editor.gridTab === "Grid" && hasSelection ? (
          <button
            type="button"
            className="action-main"
            onClick={() => editor.openGridDraft(layout?.custom, layout?.rows, layout?.cols)}
          >
            {layout?.custom ? "Edit custom grid" : "Design custom grid"}
          </button>
        ) : undefined}
      >
        {editor.gridTab === "Grid" ? (hasSelection ? (
          <div className="pad-md">
            <GridLayoutDisplay
              selected={layout?.grid}
              handleClick={(data) => {
                if (!data) return;
                if (shellSelected) editor.selectGrid(data.grid);
                else updateGridLayout({ grid: data.grid });
              }}
            />
            {layout && !layout.grid && !layout.custom && (
              <fieldset>
                <legend>Tracks</legend>
                {(["rows", "cols"] as const).map((track) => (
                  <label key={track}>
                    {track === "rows" ? "Rows" : "Columns"}
                    <select
                      value={layout[track] ?? 1}
                      onChange={(event) => updateGridLayout({ ...layout, [track]: Number(event.target.value) })}
                    >
                      {Array.from({ length: 12 }, (_, index) => index + 1).map((count) => (
                        <option key={count}>{count}</option>
                      ))}
                    </select>
                  </label>
                ))}
                {gridSlots(layout).map((_, index) => (
                  <fieldset key={index}>
                    <legend>Cell {index + 1}</legend>
                    {(["rows", "cols"] as const).map((track) => (
                      <label key={track}>
                        {track === "rows" ? "Row span" : "Column span"}
                        <select
                          value={layout.spans?.[index]?.[track] ?? 1}
                          onChange={(event) => updateGridLayout({
                            ...layout,
                            spans: {
                              ...layout.spans,
                              [index]: { ...layout.spans?.[index], [track]: Number(event.target.value) },
                            },
                          })}
                        >
                          {Array.from({ length: 12 }, (_, count) => count + 1).map((span) => (
                            <option key={span}>{span}</option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </fieldset>
                ))}
              </fieldset>
            )}
          </div>
        ) : <p className="pad-md">Select a layer to edit its grid.</p>) : <Elements editor={editor} />}
      </SettingsCol>
      <GridAreaSelectPopup editor={editor} handleSubmit={updateGridLayout} />
    </>
  );
};

