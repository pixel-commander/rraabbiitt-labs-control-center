import type { TestComponentProps } from './TestComponent.types';
import './css/test-component.css';

export const TestComponent = ({
  children,
  className = "",
}: TestComponentProps) => {
  className = `test-component ${className}`;
  return (
    <div data-grid="holy-grail" className={[className, " testcomponent-shell"].filter(Boolean).join(" ")}>
  <div data-area="header" className="testcomponent-area-header"></div>
  <div data-area="left" className="testcomponent-area-left"></div>
  <div data-area="main" className="testcomponent-area-main">{children}</div>
  <div data-area="right" className="testcomponent-area-right"></div>
  <div data-area="footer" className="testcomponent-area-footer"></div>
</div>
  );
};
