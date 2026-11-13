import { ContentData } from "../ContentData/ContentData";
import type { GenericContentProps } from "./GenericContent.types";
import "./css/generic-content.css";

export const GenericContent = ({ response, className = "" }: GenericContentProps) => {
  return <div className={["generic-content", className].filter(Boolean).join(" ")}><ContentData value={response} /></div>;
};

