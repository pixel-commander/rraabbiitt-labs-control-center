import type { ReactNode } from "react";
import "./css/__PAGE_SLUG__.css";
export interface __PAGE_NAME__Props {
  children?: ReactNode;
  className?: string;
}
export const __PAGE_NAME__ = ({
  children,
  className = "",
}: __PAGE_NAME__Props) => {
  return (
    <div className={`${className} __PAGE_SLUG__`}>
      <h1>{__PAGE_TITLE__}</h1>
      <p>{__PAGE_DESCRIPTION__}</p>
      {children ?? __PAGE_CONTENT__}
    </div>
  );
};
