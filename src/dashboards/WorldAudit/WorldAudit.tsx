import type { ReactNode } from "react";
import { useWorldAudit } from "./hooks/useWorldAudit";
import { RunTooltip } from "./RunTooltip/RunTooltip";
import { PageHeader } from "../../components/UiElements/PageHeader/PageHeader";
import { StatusLabel } from "../../components/UiElements/StatusLabel/StatusLabel";
import { ToggleSection } from "../../components/ToggleSection/ToggleSection";
import "./css/world-audit.css";
export interface WorldAuditProps {
  children?: ReactNode;
  className?: string;
}
export const WorldAudit = ({
  children,
  className = "",
}: WorldAuditProps) => {
  const { data, error } = useWorldAudit();
  const maxCalls = Math.max(1, ...(data?.tools.map(tool => tool.calls) ?? []));
  const timeline = data?.hours.length ? data.hours : data?.days ?? [];
  const maxDaily = Math.max(1, ...timeline.flatMap(day => [day.calls, day.runs]));
  const timedRuns = (data?.runs ?? []).filter(run => run.start !== null && run.end !== null).slice().reverse();
  const maxDuration = Math.max(1, ...timedRuns.map(run => (run.end! - run.start!)/1000));
  const tickMax = Math.ceil(maxDaily / 4) * 4;
  const date = (value: number) => new Date(value).toLocaleString("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return (
    <div className={`${className} world-audit`} data-cols="1" data-gap="section">
      <PageHeader label="RRAABBIITT / OBSERVABILITY" Headline={<h1>World Audit</h1>}
        Right={<StatusLabel status={error ? "error" : data ? "success" : "waiting"} label={error ? "UPDATE FAILED" : data ? "DATABASE CONNECTED" : "LOADING"} />} />
      <p className="world-audit__muted">Tool calls and saved runs. All recorded history, directly from the project database.</p>
      {error && <p role="alert" className="container-outline pad">{error}{data ? " Showing the last successful update." : ""}</p>}
      {data && <>
        <div className="world-audit__metrics">
          {[ ["TOOL CALLS", data.totalCalls], ["TOOLS USED", data.tools.length], ["SAVED RUNS", data.runs.length], ["FAILED RUNS", data.runs.filter(run => run.status === "error").length] ].map(([label, value]) => (
            <div className="container-alt pad world-audit__metric" key={label}><span>{label}</span><strong>{Number(value).toLocaleString()}</strong></div>
          ))}
        </div>
        <section className="container-main pad world-audit__panel" data-cols="1" data-gap="content">
          <PageHeader label={data.hours.length ? `${data.days[0].date} / HOURLY / AMERICA/CHICAGO` : "ALL RECORDED HISTORY / DAILY / AMERICA/CHICAGO"} Headline="Activity over time"
            Right={<div className="world-audit__legend"><span>● Tool calls</span><span>● Saved runs</span></div>} />
          {data.days.length ? <div className="world-audit__chart-scroll">
            <svg className="world-audit__timeline" viewBox={`0 0 ${Math.max(760, timeline.length * 44)} 300`} style={{ minWidth: Math.max(600, timeline.length * 36) }} role="img" aria-label="Tool calls and saved runs over time. Hover bars for exact counts.">
              {[0,1,2,3,4].map(tick => <g key={tick}><line x1="50" x2={Math.max(760, timeline.length * 44)-20} y1={244-tick*50} y2={244-tick*50} className="world-audit__grid" /><text x="38" y={248-tick*50} textAnchor="end">{tickMax*tick/4}</text></g>)}
              {timeline.map((day, index) => {
                const width = Math.max(760, timeline.length*44);
                const slot = (width-90)/timeline.length;
                const x = 55+slot*(index+0.5);
                const bar = Math.min(28, slot/4);
                return <g key={day.date}>
                  <RunTooltip<SVGRectElement> title="Tool calls" details={[{label:"Period (Chicago)",value:day.date},{label:"Calls",value:day.calls}]}>{ref => <rect ref={ref} x={x-bar-3} y={244-day.calls/tickMax*200} width={bar} height={day.calls/tickMax*200} rx="3" className="world-audit__calls" />}</RunTooltip>
                  <RunTooltip<SVGRectElement> title="Saved runs" details={[{label:"Period (Chicago)",value:day.date},{label:"Runs",value:day.runs}]}>{ref => <rect ref={ref} x={x+3} y={244-day.runs/tickMax*200} width={bar} height={day.runs/tickMax*200} rx="3" className="world-audit__runs" />}</RunTooltip>
                  {day.calls > 0 && <text x={x-bar/2-3} y={235-day.calls/tickMax*200} textAnchor="middle">{day.calls}</text>}
                  {day.runs > 0 && <text x={x+bar/2+3} y={235-day.runs/tickMax*200} textAnchor="middle">{day.runs}</text>}
                  <text x={x} y="276" textAnchor="middle">{day.date}</text>
                </g>;
              })}
            </svg>
          </div> : <p>No dated activity has been saved yet.</p>}
          <ToggleSection title="View exact daily counts" container_class="container-outline">
            <table className="world-audit__table"><thead><tr><th>Date (Chicago)</th><th>Tool calls</th><th>Saved runs</th></tr></thead><tbody>{data.days.map(day => <tr key={day.date}><td>{day.date}</td><td>{day.calls}</td><td>{day.runs}</td></tr>)}</tbody></table>
          </ToggleSection>
        </section>
        <section className="container-main pad world-audit__panel" data-cols="1" data-gap="content">
          <PageHeader label="ALL TOOLS / SORTED BY CALL COUNT" Headline="Tool usage" Right={<span>{data.totalCalls.toLocaleString()} calls</span>} />
          {data.tools.length ? <div className="world-audit__bars">{data.tools.map(tool => <div className="world-audit__bar-row" key={tool.id}>
            <div className="world-audit__tool-name"><strong>{tool.name}</strong><code>{tool.id}</code></div>
            <RunTooltip<HTMLDivElement> title={tool.name} details={[{label:"Tool ID",value:String(tool.id)},{label:"Calls",value:tool.calls},{label:"First used (Chicago)",value:date(tool.first)},{label:"Last used (Chicago)",value:date(tool.last)}]}>{ref => <div ref={ref} className="world-audit__track" role="img" aria-label={`${tool.name}: ${tool.calls} calls`}><span style={{ width: `${tool.calls/maxCalls*100}%` }} /></div>}</RunTooltip>
            <strong className="world-audit__count">{tool.calls.toLocaleString()}</strong>
          </div>)}</div> : <p>No tool calls have been saved yet.</p>}
        </section>
        <section className="container-main pad world-audit__panel" data-cols="1" data-gap="content">
          <PageHeader label="PERSISTED RUN RECORDS / NEWEST FIRST" Headline="Saved runs" Right={<span>{data.runs.length} runs</span>} />
          {timedRuns.length > 0 && <>
            <p className="world-audit__muted">Run duration in seconds · Oldest to newest · Hover a bar for its run and time.</p>
            <div className="world-audit__chart-scroll"><svg className="world-audit__timeline" viewBox="0 0 1000 220" style={{ minWidth: 600 }} role="img" aria-label="Duration of every saved run with recorded start and end times, oldest to newest">
              {[0,1,2,3,4].map(tick => <g key={tick}><line x1="55" x2="980" y1={180-tick*38} y2={180-tick*38} className="world-audit__grid" /><text x="45" y={184-tick*38} textAnchor="end">{(maxDuration*tick/4).toFixed(1)}s</text></g>)}
              {timedRuns.map((run,index) => { const slot=920/timedRuns.length; const duration=(run.end!-run.start!)/1000; return <g key={run.id}><RunTooltip<SVGRectElement> run={run}>{ref => <rect ref={ref} x={60+index*slot} y={180-duration/maxDuration*152} width={Math.max(2,slot*.65)} height={Math.max(1,duration/maxDuration*152)} rx="3" fill={run.status === "error" ? "var(--status-error)" : run.warnings ? "var(--status-warning)" : "var(--status-success)"} />}</RunTooltip><text x={60+index*slot+slot*.325} y="205" textAnchor="middle">{index+1}</text></g>; })}
            </svg></div>
          </>}
          <div className="world-audit__chart-scroll"><table className="world-audit__table"><thead><tr><th>Run</th><th>Status</th><th>Started (Chicago)</th><th>Duration</th><th>Steps</th></tr></thead>
            <tbody>{data.runs.map(run => <tr key={run.id}><td><strong>{run.name}</strong><code>{run.id}</code></td><td><StatusLabel status={run.status === "error" ? "error" : run.warnings ? "warn" : run.status === "complete" ? "success" : "waiting"} label={run.warnings && run.status === "complete" ? "WARNING" : run.status.toUpperCase()} /></td><td>{run.start === null ? "Not recorded" : date(run.start)}</td><td>{run.start !== null && run.end !== null ? `${((run.end-run.start)/1000).toFixed(2)} s` : "Not recorded"}</td><td>{run.steps ?? "—"}</td></tr>)}</tbody>
          </table></div>
          {!data.runs.length && <p>No runs have been saved yet.</p>}
        </section>
        <p className="world-audit__muted">Updated {date(data.updated)} · Refreshes every 10 seconds · Counts reflect saved records only.</p>
      </>}
      <div>
        {children ?? ""}
      </div>
    </div>
  );
};
