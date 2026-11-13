import type { HandlerKey } from "../../../../HouseKeys.types";
import type { DesignerProps } from "../../RABDesigner.types";
export interface DesignerCanvasProps extends DesignerProps {
  handleReady: HandlerKey<
    { fit: () => void; zoom: (scale: number) => void; cancel: () => void },
    "ready",
    void
  >;
}
