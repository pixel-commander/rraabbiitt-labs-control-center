import type { ReactNode } from "react";
import "./css/__FILE_SLUG__.css";
export interface __FILE_NAME__Props {
  children?: ReactNode;
  className?: string;
}
export const __FILE_NAME__ = ({
  children,
  className = "",
}: __FILE_NAME__Props) => {
  return (
    <div data-grid="header-main" className={`${className} __FILE_SLUG__`}>
      <header data-area="header" />
      <div data-area="main">
        <h1>{__TITLE__}</h1>
        {children ?? __CONTENT__}
      </div>
    </div>
  );
};
