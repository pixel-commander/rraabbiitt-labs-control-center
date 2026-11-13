import { ContentData } from "../ContentData/ContentData";
import type { ApiCallContentProps } from "./ApiCallContent.types";
import "./css/api-call-content.css";

export const ApiCallContent = ({ response, className = "" }: ApiCallContentProps) => {
  return <div className={["api-call-content", className].filter(Boolean).join(" ")}><ContentData value={response} /></div>;
};

