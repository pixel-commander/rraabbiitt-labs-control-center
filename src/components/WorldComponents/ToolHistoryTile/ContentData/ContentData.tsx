import type { ContentDataProps } from "./ContentData.types";
import "./css/content-data.css";

export const ContentData = ({ value, className = "" }: ContentDataProps) => {
  return <pre className={["content-data", className].filter(Boolean).join(" ")}><code>{typeof value === "string" ? value : JSON.stringify(value, null, 2) ?? "No data recorded yet."}</code></pre>;
};

