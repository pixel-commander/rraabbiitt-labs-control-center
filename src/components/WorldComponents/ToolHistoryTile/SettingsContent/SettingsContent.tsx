import { ContentData } from "../ContentData/ContentData";
import type { SettingsContentProps } from "./SettingsContent.types";
import "./css/settings-content.css";

export const SettingsContent = ({ response, settings, className = "" }: SettingsContentProps) => {
  return <div className={["settings-content", className].filter(Boolean).join(" ")}><ContentData value={response ?? settings} /></div>;
};

