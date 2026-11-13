import { ContentData } from "../ContentData/ContentData";
import type { SkillContentProps } from "./SkillContent.types";
import "./css/skill-content.css";

export const SkillContent = ({ response, className = "" }: SkillContentProps) => {
  const record = response && typeof response === "object" ? response as Record<string, unknown> : undefined;
  return <div className={["skill-content", className].filter(Boolean).join(" ")}><ContentData value={record?.body ?? record?.code ?? response} /></div>;
};

