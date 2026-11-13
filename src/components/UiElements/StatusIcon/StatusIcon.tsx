import { IconButton } from "../IconButton/IconButton";
import { StatusLabel } from "../StatusLabel/StatusLabel";
import type { StatusIconProps } from "./StatusIcon.types";
import "./css/status-icon.css";

export const StatusIcon = ({ status = "primary", busy = false, className, ...props }: StatusIconProps) => (
  <span className="status-icon-control" aria-busy={busy}>
    <IconButton {...props} action_atom="action-light"
      Icon={<StatusLabel className="status-icon-indicator"
        status={status === "warning" ? "warn" : status === "primary" ? undefined : status}
        status_color={status === "primary" ? "var(--color-primary)" : undefined} />}
      disabled={props.disabled || busy}
      className={["status-icon", busy ? "status-icon--busy" : "", className].filter(Boolean).join(" ")} />
  </span>
);
