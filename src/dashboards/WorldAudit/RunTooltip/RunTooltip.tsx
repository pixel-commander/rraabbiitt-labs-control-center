import { useRef } from "react";
import { Tooltip } from "../../../components/Tooltip/Tooltip";
import { StatusLabel } from "../../../components/UiElements/StatusLabel/StatusLabel";
import type { RunTooltipProps } from "./RunTooltip.types";
import "./css/run-tooltip.css";

const timestamp = (value: number | null) => value === null ? "Not recorded" : new Date(value).toLocaleString("en-US", {
  timeZone: "America/Chicago", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit",
});

export const RunTooltip = <T extends Element,>({ run, title, details = [], children }: RunTooltipProps<T>) => {
  const targetRef = useRef<T>(null);
  const fields = run ? [
    { label: "Run ID", value: String(run.id) },
    { label: "Started", value: timestamp(run.start) },
    { label: "Finished", value: timestamp(run.end) },
    { label: "Duration", value: run.start !== null && run.end !== null ? `${((run.end - run.start) / 1000).toFixed(2)} s` : "Not recorded" },
    { label: "Steps", value: run.steps ?? "Not recorded" },
    { label: "Warnings", value: run.warnings ?? 0 },
  ] : details;

  console.log(details);
  return <>
    {children(targetRef)}
    <Tooltip targetRef={targetRef} title={run?.name ?? title} placement="above" container_class="container-alt" className="run-tooltip">
      {run && <StatusLabel status={run.status === "error" ? "error" : run.warnings ? "warn" : run.status === "complete" ? "success" : "waiting"}
        label={run.status === "complete" && run.warnings ? "COMPLETED WITH WARNINGS" : run.status.toUpperCase()} />}
      <dl className="run-tooltip__details">{fields.map(field => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>
      {run && <p className="run-tooltip__timezone">Times in America/Chicago</p>}
    </Tooltip>
  </>;
};
