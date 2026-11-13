import { GridAreaSelect } from "../../../../../components/GridAreaSelect/GridAreaSelect";
import type { GridAreaSelectPopupProps } from "./GridAreaSelectPopup.types";
import "./css/grid-area-select-popup.css";

export const GridAreaSelectPopup = (props: GridAreaSelectPopupProps) => {
  const { editor, handleSubmit, className } = props;
  const draft = editor.gridDraft;
  if (!draft) return null;

  return (
    <dialog
      className={["component-factory-grid-dialog", className].filter(Boolean).join(" ")}
      aria-label="Design custom grid"
      ref={(dialog) => {
        if (dialog && !dialog.open) dialog.showModal();
      }}
      onClose={() => editor.setGridDraft(undefined)}
    >
      <div data-grid="shell" data-gap="control">
        <header data-area="header">
          <strong>Design custom grid</strong>
          <div data-cols="2" data-gap="control">
            {(["rows", "cols"] as const).map((track) => {              const min = Math.max(1, ...draft.areas.map((area) =>
                track === "rows" ? area.r1 + area.rows - 1 : area.c1 + area.cols - 1,
              ));
              return (
                <label key={track}>
                  {track === "rows" ? "Rows" : "Columns"}
                  <select
                    value={draft[track]}
                    onChange={(event) => editor.setGridDraft({ ...draft, [track]: Number(event.target.value) })}
                  >
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((count) => (
                      <option key={count} disabled={count < min}>{count}</option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
          <p>Drag across empty cells to draw an area.</p>
        </header>
        <div data-area="main" className="component-factory-grid-draft">
          <GridAreaSelect
            layout={draft}
            selected={editor.draftArea}
            handleClick={(area) => editor.setDraftArea(area?.id)}
            handleCreate={(area) => { if (area) editor.addDraftArea(area); }}
            handleChange={(next) => { if (next) editor.setGridDraft(next); }}
          />
        </div>
        <footer data-area="footer" data-cols="2" data-gap="control">
          <button type="button" className="action-main" onClick={() => editor.setGridDraft(undefined)}>Cancel</button>
          <button
            type="button"
            className="action-accent"
            disabled={!draft.areas.length}
            onClick={() => {
              if (!draft.areas.length) return;
              handleSubmit?.({ custom: draft }, "grid-layout", props);
              editor.setGridDraft(undefined);
            }}
          >
            Apply grid
          </button>
        </footer>
      </div>
    </dialog>
  );
};
