import { FolderTree } from "../../../FolderTree/FolderTree";
import { StatusLabel } from "../../../UiElements/StatusLabel/StatusLabel";
import { settingsPathsToTree } from "../../../../js/settings-paths-to-tree/settings-paths-to-tree";
import type { PathsProps } from "../../../../HouseKeys.types";
import type { RunnerContentProps } from "./RunnerContent.types";
import "./css/runner-content.css";

export const RunnerContent = ({ run, response, status = run?.status, label = "Runner", className = "" }: RunnerContentProps) => {
  const result = response && typeof response === "object" ? response as Record<string, unknown> : undefined;
  const paths = Array.isArray(result?.paths) ? result.paths.filter((path): path is PathsProps =>
    path != null && typeof path === "object" &&
    (path.path === undefined || typeof path.path === "string") &&
    (path.file === undefined || typeof path.file === "string") &&
    (path.name === undefined || typeof path.name === "string")) : [];
  const items = settingsPathsToTree(paths);
  const duration = run?.date_start != null && run.date_end != null ? run.date_end - run.date_start : undefined;
  const summary = result?.summary && typeof result.summary === "object" ? result.summary as Record<string, unknown> : undefined;
  return (
    <div data-grid="side-right" data-collapse="1" className={["runner-content", className].filter(Boolean).join(" ")}>
      <div data-area="main" className="runner-content__info">
        <span className="runner-content__label">{label}</span>
        <strong className="runner-content__name">{run?.name ?? "Run"}</strong>
        <StatusLabel status={status === "error" ? "error" : status === "complete" ? "success" : "waiting"} label={status ?? "Waiting"} />
        {run?.error && <p>{run.error}</p>}
        <dl className="runner-content__stats">
          {duration != null && <div><dt>Duration</dt><dd>{duration} ms</dd></div>}
          <div><dt>Returned paths</dt><dd>{paths.length}</dd></div>
          {run?.id != null && <div><dt>ID</dt><dd>{run.id}</dd></div>}
        </dl>
        {summary && <dl className="runner-content__summary">{Object.entries(summary).filter(([, value]) => value != null && typeof value !== "object").map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl>}
      </div>
      <div data-area="side" className="runner-content__paths scroll-both">
        <strong className="runner-content__label">Paths</strong>
        {items.length ? <FolderTree items={items} start_state="open" auto_size={false} /> : <p>No paths returned.</p>}
      </div>
    </div>
  );
};

