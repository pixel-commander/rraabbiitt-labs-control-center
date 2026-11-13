import { ContentData } from "../ContentData/ContentData";
import type { SummaryContentProps } from "./SummaryContent.types";
import "./css/summary-content.css";

export const SummaryContent = ({ response, className = "" }: SummaryContentProps) => {
  const record = response && typeof response === "object" ? response as Record<string, unknown> : undefined;
  return <div className={["summary-content", className].filter(Boolean).join(" ")}><ContentData value={record?.summary ?? response} /></div>;
};

