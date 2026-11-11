import "./css/code-viewer.css";
import { useId } from "react";
import type { CodeViewerProps } from "./CodeViewer.types";
import { useCodeViewer } from "../hooks/useCodeViewer/useCodeViewer";

export const CodeViewer = (props: CodeViewerProps) => {
  const viewer = useCodeViewer(props);
  const surfaceId = useId();
  const helpId = useId();
  return (
    <div
      ref={viewer.rootRef}
      className={`code-viewer ${props.container_class ?? ""} ${props.className ?? ""}`}
      data-grid="side-right"
      data-mode={props.mode ?? "view"}
      data-inline={props.inline ?? false}
      style={props.style}
    >
      <div data-area="main" id={surfaceId} ref={viewer.editorRef} className="code-viewer__surface" aria-describedby={helpId} />
      <span id={helpId} className="code-viewer__help">
        Tab indents; Shift+Tab outdents. Press Escape to leave the editor. Ctrl+F searches the document.
      </span>
      {(props.showMinimap ?? true) && !viewer.viewport.compact && (
        <div data-area="side" className="code-viewer__minimap-column">
          <div
            className="code-viewer__minimap"
            style={{ height: viewer.viewport.pixels }}
            role="scrollbar"
            tabIndex={0}
            aria-label="Code minimap"
            aria-orientation="vertical"
            aria-controls={surfaceId}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(viewer.fraction * 100)}
            onPointerDown={viewer.onMinimapPointer}
            onPointerMove={viewer.onMinimapPointer}
            onKeyDown={viewer.onMinimapKey}
          >
            <canvas ref={viewer.mapRef} className="code-viewer__map-lines" aria-hidden="true" />
            <div className="code-viewer__map-window" style={{ top: `${viewer.viewport.top * 100}%`, height: `${viewer.viewport.height * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};
