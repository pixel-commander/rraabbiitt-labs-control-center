import { ToggleSection } from "../../ToggleSection/ToggleSection";
import { useRef } from "react";
import { StatusIcon } from "../../UiElements/StatusIcon/StatusIcon";
import { SmartTooltip } from "../../SmartTooltip/SmartTooltip";
import type { ToolHistoryTileProps } from "./ToolHistoryTile.types";
import { ToolHistoryContent } from "./ToolHistoryContent";
import "./css/tool-history-tile.css";

export const ToolHistoryTile = ({
  run, title, className = "", children, ...props
}: ToolHistoryTileProps) => {
  const statusRef = useRef<HTMLSpanElement>(null);
  const query = run.lookup?.query ?? run.settings?.query;
  const lookupId = run.lookup?.id ?? run.settings?.id;
  const loader = run.name === "tool-loader";
  const response = run.response as { summary?: { count?: number }; paths?: { id?: number; name?: string }[]; search?: { method?: string } } | undefined;
  const search = run.name === "search-records";
  const matchCount = response?.summary?.count ?? response?.paths?.length;
  const noMatches = search && run.status === "complete" && matchCount === 0;
  const statusText = `${loader ? "tool-load" : run.name ?? "tool"} ${noMatches ? "no matches" : run.status}${run.error ? `: ${run.error}` : ""}`;
  return (
  <ToggleSection {...props} title={title ?? (
    <div className="tool-history-tile__heading" data-grid="sides">
      <span ref={statusRef} data-area="left">
        <StatusIcon title={statusText} status={run.status === "error" ? "error" : run.error || noMatches ? "warning" : run.status === "complete" ? "success" : "primary"} />
        <SmartTooltip targetRef={statusRef} content={statusText} />
      </span>
      <strong data-area="main"><code>{query != null ? String(query) : search ? "Search query not recorded" : loader ? lookupId != null ? `Tool ${lookupId}` : "" : run.name ?? run.id ?? "Unnamed tool"}</code></strong>
      <time data-area="right" dateTime={run.time}>{new Date(run.date_start ?? run.time).toLocaleTimeString()}</time>
    </div>
  )} className={["tool-history-tile", className].filter(Boolean).join(" ")}>
    <div className="tool-history-tile__details">
      <code>Tool: {run.name ?? "Unnamed tool"}</code>
      <code>Status: {run.status}</code>
      {query != null && <code className="tool-history-tile__query">Query: {String(query)}</code>}
      <ToolHistoryContent run={run} />
      {lookupId != null && <code className="tool-history-tile__query">Lookup ID: {String(lookupId)}</code>}
      {run.id != null && <code className="tool-history-tile__muted">Tool ID {run.id}</code>}
      {run.date_end != null && run.date_start != null && <code className="tool-history-tile__muted">{run.date_end - run.date_start} ms</code>}
      <time dateTime={run.time}>{new Date(run.date_start ?? run.time).toLocaleTimeString()}</time>
      {run.error && <p>{run.error}</p>}
      <details><summary>Input and return data</summary>
      <strong>Input settings</strong>
      <pre className="tool-history-tile__response"><code>{JSON.stringify(run.settings ?? run.lookup, null, 2) ?? "No input recorded."}</code></pre>
      <strong>Return</strong>
      <pre className="tool-history-tile__response"><code>{JSON.stringify(run.response, null, 2) ?? "No return recorded yet."}</code></pre>
      </details>
    </div>
    {children}
  </ToggleSection>
  );
};

