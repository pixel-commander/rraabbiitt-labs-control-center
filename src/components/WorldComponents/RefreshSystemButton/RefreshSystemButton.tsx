import "./css/refresh-system-button.css";
import type { RefreshSystemButtonProps } from "./RefreshSystemButton.types";
import { DropdownButton } from "../../DropdownButton/DropdownButton";
import { StatusLabel } from "../../UiElements/StatusLabel/StatusLabel";

export const RefreshSystemButton = ({ status = "idle", message, children, ...props }: RefreshSystemButtonProps) => (
  <span className="refresh-system-control" aria-busy={status === "refreshing"}>
    <DropdownButton {...props} button_class={props.button_class ?? "action-light mcp-viewer"}
      disabled={props.disabled || status === "refreshing"}
      is_open={status === "refreshing"}
      is_closed={status !== "refreshing"}
      title={<div data-grid="side-right" className="refresh-system-button-title">
        <span data-area="main">{status === "refreshing" ? "Rescanning..." : "Rescan world"}</span>
        <span data-area="side" aria-hidden="true">
          <StatusLabel status={status === "warning" ? "warn" : status === "error" ? "error" : "success"}
            status_color={status === "idle" || status === "refreshing" ? "var(--color-primary)" : undefined} />
        </span>
      </div>}>
      {children}
    </DropdownButton>
    <span className="refresh-system-announcement" role="status">{status === "idle" ? "" : message}</span>
  </span>
);
