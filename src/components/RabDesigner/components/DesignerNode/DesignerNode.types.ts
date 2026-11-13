import type { DesignerProps, DesignerElement } from "../../RABDesigner.types";
export interface DesignerNodeProps extends DesignerProps {
  node: DesignerElement;
  inGrid?: boolean;
}
