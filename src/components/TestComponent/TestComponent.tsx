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
  <div data-area="main" data-rows="4" data-cols="5" className="testcomponent-area-main"><div className="composition-slot-main-1 testcomponent-area-main_2f_1794367090071">{children}</div><div className="composition-slot-main-2 testcomponent-area-main_2f_1794367093965"></div><div className="composition-slot-main-3 testcomponent-area-main_2f_1794367095623"></div><div className="composition-slot-main-4 testcomponent-area-main_2f_1794367096527"></div></div>
  <div data-area="right" className="testcomponent-area-right"></div>
  <div data-area="footer" className="testcomponent-area-footer"></div>
</div>
  );
};
