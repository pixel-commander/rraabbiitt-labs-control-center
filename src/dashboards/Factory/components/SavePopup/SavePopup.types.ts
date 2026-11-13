import type { HandlerKey, HouseKeys } from "../../../../HouseKeys.types";
import type { FactorySaveData, FactorySaveResult, FactoryOverwriteConfirmation } from "../../Factory.types";

export interface SavePopupProps extends HouseKeys {
  /** Initial HouseKeys values and composition supplied by the dashboard. */
  data: FactorySaveData;
  /** Disables editing and dismissal while the save request is running. */
  pending?: boolean;
  /** Completed save receipt whose paths populate the saved file browser. */
  result?: FactorySaveResult;
  /** Existing component receipt that needs explicit overwrite approval. */
  confirmation?: FactoryOverwriteConfirmation;
  /** Save error displayed while preserving the current form entries. */
  error?: string;
  /** Receives the completed form, component-runner action, and complete props bag. */
  handleSave?: HandlerKey<FactorySaveData, "component-runner", Promise<void> | void, SavePopupProps>;
  /** Requests dismissal without saving when no request is pending. */
  handleCancel?: HandlerKey<undefined, "cancel", void, SavePopupProps>;
  /** Additional classes applied to the popup root. */
  className?: string;
}
