import { createPortal } from "react-dom";
import world from "../../../rab.world.json";
import { FloatWindow } from "../FloatWindow/FloatWindow";
import { StatusLabel } from "../UiElements/StatusLabel/StatusLabel";
import { PageHeader } from "../UiElements/PageHeader/PageHeader";
import { ToggleSection } from "../ToggleSection/ToggleSection";
import { useMcpViewer } from "./hooks/useMcpViewer/useMcpViewer";
import "./css/mcp-viewer.css";

export const McpViewer = () => {
  const { open, rect, status, tools, toolError, activity, buttonRef, windowRef, handleClick, handleChange, handleClose } = useMcpViewer();
  const label = status === "connected" ? "Connected" : status === "checking" ? "Checking" : "Disconnected";
  const executions = activity.flatMap(event =>
    (event.runs ?? []).map((run, step) => ({ ...run, time: event.time, key: `${event.time}-${step}` })),
  );
  return (
    <>
      <button ref={buttonRef} type="button"
        className={["mcp-viewer action-light", `is-${status}`, open ? "is-active" : ""].filter(Boolean).join(" ")}
        aria-label={`Open MCP settings — ${label}`}
        aria-haspopup="dialog" aria-expanded={open} onClick={handleClick}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 2 1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" />
        </svg>{" "}<span>MCP</span>{" "}
        <span className="mcp-viewer__status" aria-live="polite"><StatusLabel status={status === "connected" ? "success" : status === "checking" ? "waiting" : "error"} label={label} /></span>
      </button>
      {open && createPortal(
        <div ref={windowRef} className="mcp-viewer__layer" role="dialog" aria-label="MCP settings"
          onKeyDown={event => { if (event.key === "Escape") handleClose(); }}>
          <FloatWindow title="MCP server" rect={rect} open={open}
            handleChange={handleChange} handleClose={handleClose}>
            <div className="mcp-viewer__content" data-cols="1" data-gap="section">
            <section data-cols="1" data-gap="control">
              <PageHeader label="PROJECT MCP / STREAMABLE HTTP" Headline="Server connection"
                Right={<StatusLabel status={status === "connected" ? "success" : status === "checking" ? "waiting" : "error"} label={label} />} />
              <code className="mcp-viewer__muted">http://{world.mcp.host}:{world.mcp.port}/mcp</code>
            </section>
            <section data-cols="1" data-gap="content">
            <PageHeader label="AVAILABLE TO THE CLIENT" Headline="Exposed tools" Right={<span>{tools.length}</span>} />
            {toolError ? <p role="alert">{toolError}</p> : tools.length ? tools.map(tool => (
              <div key={tool.name} className="mcp-viewer__tool container-outline pad" data-cols="1" data-gap="control">
                <strong><code>{tool.name}</code></strong>
                <p>{tool.description}</p>
              </div>
            )) : <p>Loading tool list…</p>}
            </section>
            <section data-cols="1" data-gap="content">
            <PageHeader label="SHARED RUNNER / UPDATES EVERY 2S" Headline="Tool activity" />
            {executions.length ? <ol className="mcp-viewer__activity">{executions.map(run => (
              <li key={run.key} className="mcp-viewer__request container-alt pad">
                <div className="mcp-viewer__request-main">
                  <strong><code>{run.name ?? run.id ?? "Unnamed tool"}</code></strong>
                  {run.id != null && <code className="mcp-viewer__muted">Tool ID {run.id}</code>}
                  {run.date_end != null && run.date_start != null && <code className="mcp-viewer__muted">{run.date_end - run.date_start} ms</code>}
                  {run.error && <p>{run.error}</p>}
                </div>
                <div className="mcp-viewer__request-result">
                  <StatusLabel status={run.status === "error" ? "error" : run.error ? "warn" : run.status === "complete" ? "success" : "waiting"}
                    label={run.status === "complete" ? run.error ? "COMPLETED WITH WARNING" : "SUCCESS" : run.status.toUpperCase()} />
                  <time dateTime={run.time}>{new Date(run.date_start ?? run.time).toLocaleTimeString()}</time>
                </div>
              </li>
            ))}</ol> : <p>No tool executions recorded yet.</p>}
            <p className="mcp-viewer__muted">Tool outcomes and durations come from the shared runner.</p>
            </section>
            <ToggleSection title="Server settings" container_class="container-outline">
            <p className="mcp-viewer__muted">Source: rab.world.json</p>
            <dl data-cols="1" data-gap="content" className="mcp-viewer__settings">
              {Object.entries(world.mcp).map(([name, value]) => (
                <div key={name} data-cols="2" data-gap="content">
                  <dt>{name}</dt><dd><code>{String(value)}</code></dd>
                </div>
              ))}
            </dl>
            </ToggleSection>
            </div>
          </FloatWindow>
        </div>, document.body,
      )}
    </>
  );
};
