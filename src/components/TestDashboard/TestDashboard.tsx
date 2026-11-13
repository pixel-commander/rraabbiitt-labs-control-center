import type { ReactNode } from "react";
import "./css/test-dashboard.css";
export interface TestDashboardProps {
  children?: ReactNode;
  className?: string;
}
export const TestDashboard = ({
  children,
  className = "",
}: TestDashboardProps) => {
  return (
    <div data-grid="holy-grail" className={[className, " testdashboard-shell"].filter(Boolean).join(" ")}>
  <div data-area="header" className="testdashboard-area-header"></div>
  <div data-area="left" className="testdashboard-area-left"></div>
  <div data-area="main" className="testdashboard-area-main">{children}</div>
  <div data-area="right" className="testdashboard-area-right"></div>
  <div data-area="footer" className="testdashboard-area-footer"></div>
</div>
  );
};
