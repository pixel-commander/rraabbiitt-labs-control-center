import type { PageHeaderProps } from "./PageHeader.types";
import "./css/page-header.css";
export const PageHeader = (props: PageHeaderProps) => {
  const { label, Headline, Right, className = "" } = props;
  return (
    <header className={["page-header", "font-alt", className].filter(Boolean).join(" ")}>
      <div className="page-header-label">{label}</div>
      <div className="page-header-headline">{Headline}</div>
      <div className="page-header-right">{Right}</div>
    </header>
  );
};
