import { SmartTooltip } from "../SmartTooltip/SmartTooltip";
import type { TooltipProps } from "./Tooltip.types";
import "./css/tooltip.css";
export const Tooltip = (props: TooltipProps) => {
  const { className = "", container_class = "container-neg" } = props;
  return (
    <SmartTooltip
      {...props}
      container_class={container_class}
      className={[
        "tooltip",
        container_class !== "" ? "tooltip-with-container" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
};
