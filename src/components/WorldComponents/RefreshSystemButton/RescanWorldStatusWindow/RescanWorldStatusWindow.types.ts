import type { RefreshStatus } from "../RefreshSystemButton.types";
export interface RescanWorldStatusWindowProps {
  status?: RefreshStatus;
  message?: string;
  report?: unknown;
  container_class?: string;
  className?: string;
}
