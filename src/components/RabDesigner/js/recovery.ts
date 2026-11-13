import type { DesignerDocument } from "../RABDesigner.types.ts";
export const recoveryKey = "rab-designer-recovery-v1";
type RecoveryStorage = Pick<Storage, "setItem" | "removeItem">;
export function storeRecovery(
  session: RecoveryStorage,
  legacy: RecoveryStorage,
  snapshot?: DesignerDocument,
) {
  if (snapshot) session.setItem(recoveryKey, JSON.stringify(snapshot));
  else session.removeItem(recoveryKey);
  legacy.removeItem(recoveryKey);
}
export function recoveryAfterSave(
  current: DesignerDocument,
  currentRevision: number,
  savedRevision: number,
) {
  return currentRevision === savedRevision ? undefined : current;
}
