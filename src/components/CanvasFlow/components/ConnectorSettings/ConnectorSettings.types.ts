import type { HandlerKey, HouseKeys } from "../../../../HouseKeys.types";
import type { FlowEdge } from "../../CanvasFlow.types";

export interface ConnectorSettingsProps extends HouseKeys {
  edge: FlowEdge;
  className?: string;
  handleChange?: HandlerKey<FlowEdge, "connector-settings", void, ConnectorSettingsProps>;
  handleClick?: HandlerKey<FlowEdge, "connector-delete", void, ConnectorSettingsProps>;
}
