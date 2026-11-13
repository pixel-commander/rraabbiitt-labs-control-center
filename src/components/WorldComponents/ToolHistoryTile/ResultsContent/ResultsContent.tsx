import { ContentData } from "../ContentData/ContentData";
import type { ResultsContentProps } from "./ResultsContent.types";
import "./css/results-content.css";

export const ResultsContent = ({ response, className = "" }: ResultsContentProps) => {
  const record = response && typeof response === "object" ? response as Record<string, unknown> : undefined;
  const paths = Array.isArray(record?.paths) ? record.paths : undefined;
  const summary = record?.summary as Record<string, unknown> | undefined;
  const search = record?.search as Record<string, unknown> | undefined;
  return <div className={["results-content", className].filter(Boolean).join(" ")}><>
      {typeof summary?.count === "number" && <p>{summary.count === 0 ? "No matches" : `${summary.count} results`}</p>}
      {typeof search?.method === "string" && <p>Matching: {search.method}</p>}
      {paths ? <ul>{paths.map((entry, index) => {
        const item = entry && typeof entry === "object" ? entry as Record<string, unknown> : undefined;
        return <li key={index}>{item ? <><strong>{String(item.title ?? item.name ?? item.path ?? "Result")}</strong>{item.id != null && <code> — {String(item.id)}</code>}{typeof item.description === "string" && <p>{item.description}</p>}</> : <ContentData value={entry} />}</li>;
      })}</ul> : <ContentData value={response} />}
    </></div>;
};

