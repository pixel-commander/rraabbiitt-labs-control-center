import { ToggleSection } from "../../../ToggleSection/ToggleSection";
import type { RescanWorldStatusWindowProps } from "./RescanWorldStatusWindow.types";
import "./css/rescan-world-status-window.css";
import "../../../../atoms/containers/container-dropdown/container-dropdown.css";

export const RescanWorldStatusWindow = ({
  status = "idle", message, report, container_class = "container-dropdown", className = "",
}: RescanWorldStatusWindowProps) => {
  if (!message && report == null && status !== "refreshing") return null;
  return (
    <div className={["rescan-world-status-window", className].filter(Boolean).join(" ")}>
      <section className={[container_class, container_class ? "pad" : "", "rescan-world-status-window-panel"].filter(Boolean).join(" ")}
        aria-label="Rescan world status" aria-busy={status === "refreshing"}>
        <p role="status">{message || "Rescanning world..."}</p>
        {report != null && (
          <ToggleSection title="Branch results">
            <pre>{JSON.stringify(report, null, 2)}</pre>
          </ToggleSection>
        )}
      </section>
    </div>
  );
};
