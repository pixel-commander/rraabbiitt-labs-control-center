import type { UiElementsProps } from "./UiElements.types";
import "./css/ui-elements.css";
export { StatusLabel } from "./StatusLabel/StatusLabel";
export { PageHeader } from "./PageHeader/PageHeader";
export { ModelTile } from "./ModelTile/ModelTile";
export { IconButton, ICON_TYPES } from "./IconButton/IconButton";
export const UiElements = ({ children, className = "" }: UiElementsProps) => {
  return (
    <div
      data-cols="1"
      className={["ui-elements", className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
};
