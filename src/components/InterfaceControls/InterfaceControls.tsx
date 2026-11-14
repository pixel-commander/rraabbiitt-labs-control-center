import type { InterfaceControlsProps } from "./InterfaceControls.types";
import "./css/interface-controls.css";
export const InterfaceControls = ({ children, className = "", size = "1em" }: InterfaceControlsProps) => (
  <div className={`interface-controls ${className}`} style={{ fontSize: size }}>{children}</div>
);
