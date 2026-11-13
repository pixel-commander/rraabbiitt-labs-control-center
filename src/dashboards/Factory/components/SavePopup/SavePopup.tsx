import type { FactoryArtifactType } from "../../Factory.types";
import "./css/save-popup.css";
import type { SavePopupProps } from "./SavePopup.types";
import { FolderTree } from "../../../../components/FolderTree/FolderTree";
import { SuccessIcon } from "../../../../icons/SuccessIcon";
import { settingsPathsToTree } from "../../../../js/settings-paths-to-tree/settings-paths-to-tree";

const fields = ["name", "title", "path", "description"] as const;

export const SavePopup = (props: SavePopupProps) => {
  const { data, pending, result, confirmation, error, className, handleSave, handleCancel } = props;
  const rootClassName = ["save-popup", "container-float", result && "save-popup--saved", className].filter(Boolean).join(" ");

  return (
    <dialog
      className={rootClassName}
      aria-label={pending ? "Saving artifact" : result ? "Artifact saved" : confirmation ? "Confirm overwrite" : "Save artifact"}
      ref={(dialog) => { if (dialog && !dialog.open) dialog.showModal(); }}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) handleCancel?.(undefined, "cancel", props);
      }}
    >
      {pending && <div className="save-popup__saving" role="status" aria-live="polite">Saving…</div>}
      {result && (
        <div data-grid="main-footer" data-gap="control">
          <div data-area="main" data-grid="side-left" className="save-popup__saved">
            <div data-area="side" className="save-popup__files">
              <FolderTree
                title="Saved files"
                items={[
                  { name: result.name, path: result.save_path ?? result.name, type: "folder", children: settingsPathsToTree(result.paths) },
                  { name: "composition.json", path: result.file, type: "json" },
                ]}
                start_state="open"
                auto_size={false}
              />
            </div>
            <div data-area="main" className="save-popup__success" role="status">
              <SuccessIcon />
              <strong>Artifact saved</strong>
              <span>{result.name}</span>
            </div>
          </div>
          <div data-area="footer" className="save-popup__close">
            <button type="button" className="action-main" onClick={() => handleCancel?.(undefined, "cancel", props)}>Close</button>
          </div>
        </div>
      )}
      {confirmation && !pending && (
        <div>
          <strong>{confirmation.name} already exists</strong>
          <p>Overwrite its returned JSX and CSS?</p>
          <div data-cols="2" data-gap="control">
            <button type="button" className="action-main" onClick={() => handleCancel?.(undefined, "cancel", props)}>Cancel</button>
            <button
              type="button"
              className="action-accent"
              onClick={() => handleSave?.({
                ...data,
                id: confirmation.id,
                name: confirmation.name,
                overwrite: true,
              }, "component-runner", props)}
            >
              Overwrite
            </button>
          </div>
        </div>
      )}
      <div hidden={Boolean(pending || result || confirmation)}>
      <form
        data-grid="shell"
        data-gap="control"
        onSubmit={(event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget);
          const name = String(values.get("name")).trim();
          const path = String(values.get("path")).trim();
          handleSave?.({
            ...data,
            id: name === data.name && path === data.path && values.get("type") === data.type ? data.id : undefined,
            name,
            title: String(values.get("title")).trim(),
            path,
            type: String(values.get("type")) as FactoryArtifactType,
            description: String(values.get("description")).trim(),
          }, "component-runner", props);
        }}
      >
        <header data-area="header"><strong>Save artifact</strong></header>
        <fieldset data-area="main" disabled={pending}>
          {fields.map((name) => (
            <label key={name}>
              {name === "path" ? "Path (destination folder)" : name}
              <input name={name} defaultValue={data[name]} required autoFocus={name === "name"} />
            </label>
          ))}
          <label>
            Type
            <select name="type" required defaultValue={data.type} onChange={(event) => {
              const input = event.currentTarget.form?.elements.namedItem("path") as HTMLInputElement | null;
              const destination = data.destinations?.[event.currentTarget.value as FactoryArtifactType];
              if (input && destination) input.value = destination;
            }}>
              <option value="component">component</option>
              <option value="subcomponent">subcomponent</option>
              <option value="page">page</option>
              <option value="dashboard">dashboard</option>
            </select>
          </label>
        </fieldset>
        <footer data-area="footer" data-cols="2" data-gap="control">
          <button type="button" className="action-main" disabled={pending} onClick={() => handleCancel?.(undefined, "cancel", props)}>Cancel</button>
          <button type="submit" className="action-accent" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
        </footer>
        {error && <p role="alert">{error}</p>}
      </form>
      </div>
    </dialog>
  );
};
