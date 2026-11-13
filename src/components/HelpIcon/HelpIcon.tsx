import { useRef } from "react";
import { SmartTooltip } from "../SmartTooltip/SmartTooltip";
import type { HelpIconProps } from "./HelpIcon.types";
import "./css/help-icon.css";

export const HelpIcon = ({
  content,
  label = "Help",
  title,
  placement = "above",
  className = "",
}: HelpIconProps) => {
  const targetRef = useRef<HTMLButtonElement>(null);
  const helpText = typeof content === "string" ? content : undefined;
  const accessibleLabel = [label, helpText].filter(Boolean).join(": ");

  return (
    <>
      <button
        ref={targetRef}
        type="button"
        className={["help-icon", className].filter(Boolean).join(" ")}
        aria-label={accessibleLabel}
        title={helpText ?? label}
      >
        ?
      </button>
      <SmartTooltip
        targetRef={targetRef}
        title={title}
        content={content}
        placement={placement}
        disabled={content === undefined && title === undefined}
      />
    </>
  );
};
