import type { DesignerProps, DesignerElement } from "../../RABDesigner.types";
export interface DesignerHtmlNodeProps extends DesignerProps {
  node: DesignerElement;
  isRoot?: boolean;
}
