import type { ReactNode } from "react";
import "./css/test-db.css";
export interface TestDbProps {
  children?: ReactNode;
  className?: string;
}
export const TestDb = ({
  children,
  className = "",
}: TestDbProps) => {
  return (
    <div data-grid="holy-grail" className={[className, " testdb-shell"].filter(Boolean).join(" ")}>
  <div data-area="header" className="testdb-area-header"></div>
  <div data-area="left" className="testdb-area-left"></div>
  <div data-area="main" className="testdb-area-main">{children}</div>
  <div data-area="right" className="testdb-area-right"></div>
  <div data-area="footer" className="testdb-area-footer"></div>
</div>
  );
};
