import type { JsonPreviewProps } from "./JsonPreview.types";
import "./css/json-preview.css";

export const JsonPreview = ({ composition, handleClose }: JsonPreviewProps) => {
  return (
    <dialog className="factory-json-preview container-float" aria-label="Composition JSON"
      ref={dialog => { if (dialog && !dialog.open) dialog.showModal(); }}
      onCancel={event => { event.preventDefault(); handleClose(); }}>
      <header className="factory-json-preview__header">
        <strong>{composition.name || "Composition"} JSON</strong>
        <button type="button" className="action-main" onClick={handleClose} autoFocus>Close</button>
      </header>
      <pre className="factory-json-preview__code scroll-both" tabIndex={0}><code>{JSON.stringify(composition, null, 2)}</code></pre>
    </dialog>
  );
};
