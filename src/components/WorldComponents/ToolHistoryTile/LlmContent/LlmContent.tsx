import { ContentData } from "../ContentData/ContentData";
import type { LlmContentProps } from "./LlmContent.types";
import "./css/llm-content.css";

export const LlmContent = ({ response, className = "" }: LlmContentProps) => {
  return <div className={["llm-content", className].filter(Boolean).join(" ")}><ContentData value={response} /></div>;
};

