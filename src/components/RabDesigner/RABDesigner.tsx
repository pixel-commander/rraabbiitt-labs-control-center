import { DesignerInspector } from "./components/DesignerInspector/DesignerInspector";
import { DesignerLibrary } from "./components/DesignerLibrary/DesignerLibrary";
import { useDesigner } from "./hooks/useDesigner";
import { DesignerCanvas } from "./components/DesignerCanvas/DesignerCanvas";
import "./css/rab-designer.css";
export const RABDesigner = () => {
  const designer = useDesigner();
  return (
    <section
      data-grid="shell"
      className="rab-designer container-cell container-cell--borderless container-cell--square"
      aria-label="RAB Designer"
      onCopy={(e) => designer.handleClipboard(e, "clipboard")}
      onCut={(e) => designer.handleClipboard(e, "clipboard")}
      onPaste={(e) => designer.handleClipboard(e, "clipboard")}
      onKeyDown={(event) => designer.handleKeyDown(event, "keydown")}
    >
      <header
        data-area="header"
        className="designer-header container-cell container-cell--borderless container-cell--square container-canvas-rule-bottom"
      >
        <div className="designer-brand">
          <span className="container-cell-content-accent">◇</span>
          <strong>RAB Designer</strong>
          <span className="container-cell-content-muted">/</span>
          <input
            key={designer.data.id + designer.data.title}
            aria-label="Composition title"
            defaultValue={designer.data.title}
            maxLength={120}
            className="container-cell container-cell--borderless"
            onBlur={(e) => {
              if (e.currentTarget.value !== designer.data.title)
                designer.handleChange(
                  { ...designer.data, title: e.currentTarget.value },
                  "change",
                );
            }}
          />
        </div>
        <div className="designer-file-actions">
          <span aria-label="Composition mode">
            {designer.data.mode === "dev"
              ? "Dev"
              : designer.data.mode === "html"
                ? "HTML"
                : "Layout"}
          </span>
          {designer.data.mode && designer.data.mode !== "canvas" && (
            <button
              className="action-main"
              onClick={() =>
                designer.handleAction(
                  {},
                  designer.data.mode === "dev"
                    ? "export-component"
                    : "export-html",
                )
              }
            >
              {designer.data.mode === "dev"
                ? "Export component"
                : "Export HTML"}
            </button>
          )}
          <button
            className="action-canvas-tool"
            aria-label="Undo"
            disabled={!designer.canUndo}
            onClick={() => designer.handleAction({}, "undo")}
          >
            ↶
          </button>
          <button
            className="action-canvas-tool"
            aria-label="Redo"
            disabled={!designer.canRedo}
            onClick={() => designer.handleAction({}, "redo")}
          >
            ↷
          </button>
          <button
            className="action-main"
            onClick={() => designer.handleAction({}, "new")}
          >
            New
          </button>
          <button
            className="action-main"
            onClick={() => designer.handleAction({}, "open")}
          >
            Open
          </button>
          <button
            className="action-main"
            onClick={() => designer.handleAction({}, "export")}
          >
            Export JSON
          </button>
          <button
            className="action-accent"
            disabled={designer.busy}
            onClick={() => designer.handleAction({}, "save")}
          >
            {designer.busy ? "Saving…" : "Save composition"}
          </button>
        </div>
      </header>
      <div data-area="main" data-grid="side-cols">
        <div data-area="left">
          <DesignerLibrary {...designer} />
        </div>
        <div data-area="main">
          <DesignerCanvas
            {...designer}
            handleReady={(controls) => {
              if (!controls) return;
              const { fit, zoom, cancel } = controls;
              designer.fit.current = fit;
              designer.zoom.current = zoom;
              designer.cancel.current = cancel;
            }}
          />
        </div>
        <div data-area="right">
          <DesignerInspector {...designer} />
        </div>
      </div>
      <footer
        data-area="footer"
        className="designer-status container-cell container-cell--borderless container-cell--square container-canvas-rule-top container-cell-content-muted"
      >
        <span role="status">
          {designer.status}
          {designer.dirty ? " · Unsaved" : ""}
        </span>
        {designer.recovery && (
          <button
            className="action-main"
            onClick={() => designer.handleRecover(undefined, "recover")}
          >
            Restore unsaved work
          </button>
        )}
        <span>Scroll to zoom · Space to pan</span>
        <span>{Math.round(designer.view.scale * 100)}%</span>
      </footer>
      <dialog
        ref={designer.newDialog}
        className="designer-open container-cell"
        aria-label="New composition"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            designer.handleAction(
              { value: String(new FormData(event.currentTarget).get("mode")) },
              "new",
            );
          }}
        >
          <h2>New composition</h2>
          <label>
            Type{" "}
            <select
              name="mode"
              aria-label="New composition type"
              className="container-cell"
              defaultValue="canvas"
            >
              <option value="canvas">Layout</option>
              <option value="dev">Dev</option>
            </select>
          </label>
          <p className="container-cell-content-muted">
            Layout saves absolute box positions. Dev saves HTML structure and
            CSS layout. The type is fixed.
          </p>
          <div className="designer-file-actions">
            <button
              type="button"
              className="action-main"
              onClick={() => designer.newDialog.current?.close()}
            >
              Cancel
            </button>
            <button type="submit" className="action-accent">
              Create composition
            </button>
          </div>
        </form>
      </dialog>
      <dialog
        ref={designer.openDialog}
        className="designer-open container-cell"
        aria-label="Open composition"
      >
        <header className="designer-file-actions">
          <h2>Open composition</h2>
          <button
            className="action-main"
            onClick={() => designer.openDialog.current?.close()}
          >
            Close
          </button>
        </header>
        <p className="container-cell-content-muted">
          Saved in RABDesigner / compositions
        </p>
        {designer.files.length ? (
          designer.files.map((file) => (
            <button
              key={file.id}
              className="action-main designer-file-row"
              onClick={() => void designer.handleOpen(file.id, "open")}
            >
              {file.title}
              <small>{file.id}.json</small>
            </button>
          ))
        ) : (
          <p>No saved compositions yet.</p>
        )}
      </dialog>
    </section>
  );
};
