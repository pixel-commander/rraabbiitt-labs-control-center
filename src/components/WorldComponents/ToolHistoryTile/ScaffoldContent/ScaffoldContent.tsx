import { ContentData } from "../ContentData/ContentData";
import type { ScaffoldContentProps } from "./ScaffoldContent.types";
import "./css/scaffold-content.css";

export const ScaffoldContent = ({ response, className = "" }: ScaffoldContentProps) => {
  return <div className={["scaffold-content", className].filter(Boolean).join(" ")}><ContentData value={response} /></div>;
};

