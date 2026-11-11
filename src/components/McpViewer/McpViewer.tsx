import { createPortal } from "react-dom";
import world from "../../../rab.world.json";
import { FloatWindow } from "../FloatWindow/FloatWindow";
import { useMcpViewer } from "./hooks/useMcpViewer/useMcpViewer";
import "./css/mcp-viewer.css";

export const McpViewer = () => {
  const { open, rect, status, buttonRef, windowRef, handleClick, handleChange, handleClose } = useMcpViewer();
  const label = status === "connected" ? "Connected" : status === "checking" ? "Checking" : "Disconnected";
  return (
    <>
      <button ref={buttonRef} type="button"
        className={["mcp-viewer action-light", `is-${status}`, open ? "is-active" : ""].filter(Boolean).join(" ")}
        aria-label={`Open MCP settings — ${label}`}
        aria-haspopup="dialog" aria-expanded={open} onClick={handleClick}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 2 1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" />
        </svg>{" "}<span>MCP</span>{" "}
        <span className="mcp-viewer__status" aria-live="polite"><span aria-hidden="true">●</span>{" "}{label}</span>
      </button>
      {open && createPortal(
        <div ref={windowRef} className="mcp-viewer__layer" role="dialog" aria-label="MCP settings"
          onKeyDown={event => { if (event.key === "Escape") handleClose(); }}>
          <FloatWindow title="MCP settings" rect={rect} open={open}
            handleChange={handleChange} handleClose={handleClose}>
            <p>Source: <code>rab.world.json</code></p>
            <dl data-cols="1" data-gap="content" className="mcp-viewer__settings">
              {Object.entries(world.mcp).map(([name, value]) => (
                <div key={name} data-cols="2" data-gap="content">
                  <dt>{name}</dt><dd><code>{String(value)}</code></dd>
                </div>
              ))}
            </dl>
          </FloatWindow>
        </div>, document.body,
      )}
    </>
  );
};
