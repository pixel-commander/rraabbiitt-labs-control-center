import { useDesignerHistory } from "./useDesignerHistory";
import { useDesignerPersistence } from "./useDesignerPersistence";
import { useDesignerInteraction } from "./useDesignerInteraction";
export function useDesigner() {
  const history = useDesignerHistory();
  const interaction = useDesignerInteraction({
    history,
    handlePersistence: (data, type, props) =>
      persistence.handleAction(data, type, props),
  });
  const persistence = useDesignerPersistence({ history, interaction });
  return {
    ...interaction,
    data: history.data,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    handlePreview: history.handlePreview,
    busy: persistence.busy,
    dirty: persistence.dirty,
    files: persistence.files,
    recovery: persistence.recovery,
    newDialog: persistence.newDialog,
    openDialog: persistence.openDialog,
    handleOpen: persistence.handleOpen,
    handleRecover: persistence.handleRecover,
  };
}
