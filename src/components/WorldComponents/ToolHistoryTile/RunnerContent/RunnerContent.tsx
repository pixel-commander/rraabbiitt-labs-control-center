import { ContentData } from "../ContentData/ContentData";
import type { RunnerContentProps } from "./RunnerContent.types";
import "./css/runner-content.css";

export const RunnerContent = ({ response, className = "" }: RunnerContentProps) => {
  return <div className={["runner-content", className].filter(Boolean).join(" ")}><ContentData value={response} /></div>;
};

