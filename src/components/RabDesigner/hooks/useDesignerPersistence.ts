import { useEffect, useRef, useState } from "react";
import type { HandlerKey } from "../../../HouseKeys.types";
import type {
  DesignerDocument,
  DesignerMode,
  DesignerProps,
} from "../RABDesigner.types";
import type { DesignerHistory } from "./useDesignerHistory";
import type { DesignerInteraction } from "./useDesignerInteraction";
import { hasUnsavedRevision } from "../js/history";
import { newDocument, locate } from "../js/document";
import { captureLayout } from "../js/layoutSnapshot";
import { validateDocument } from "../js/validation.mjs";
import { recoveryKey, storeRecovery } from "../js/recovery";
import { readThemeTokens } from "../js/theme";
import gridCSS from "../../../css/grid.css?raw";
import { siteCode } from "../js/site";
interface PersistenceProps {
  history: DesignerHistory;
  interaction: DesignerInteraction;
}
function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function useDesignerPersistence(props: PersistenceProps) {
  const { history, interaction } = props;
  const latest = useRef(props);
  latest.current = props;
  const [savedRevision, setSavedRevision] = useState<number | undefined>(
    history.state.present.revision,
  );
  const saved = useRef(savedRevision);
  const [busy, setBusy] = useState(false),
    saving = useRef(false);
  const [files, setFiles] = useState<{ id: number; title: string }[]>([]);
  const [recovery, setRecovery] = useState<DesignerDocument>();
  const newDialog = useRef<HTMLDialogElement>(null),
    openDialog = useRef<HTMLDialogElement>(null);
  const openRequest = useRef(0);
  const status = (message: string) =>
    latest.current.interaction.handleStatus(message, "status");
  const markSaved = (revision: number | undefined) => {
    saved.current = revision;
    setSavedRevision(revision);
  };
  const persistRecovery = (snapshot?: DesignerDocument) => {
    try {
      storeRecovery(sessionStorage, localStorage, snapshot);
    } catch {
      status("Browser recovery unavailable; save to the project.");
    }
  };
  const recoverable = () => {
    const state = history.current.current;
    return state.present.revision === saved.current
      ? undefined
      : state.present.data;
  };
  const dirty = hasUnsavedRevision(history.state, savedRevision);
  useEffect(() => {
    try {
      const text =
        sessionStorage.getItem(recoveryKey) ??
        localStorage.getItem(recoveryKey);
      if (text) setRecovery(validateDocument(JSON.parse(text)));
    } catch {
      status("Recovery could not be read.");
    }
  }, []);
  useEffect(() => {
    if (history.state.nextRevision === 1) return;
    const timer = setTimeout(() => persistRecovery(recoverable()), 400);
    return () => clearTimeout(timer);
  }, [history.state.present, history.state.session, savedRevision]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedRevision(history.current.current, saved.current)) return;
      event.preventDefault();
      persistRecovery(recoverable());
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  const adopt = (data: DesignerDocument, isSaved: boolean) => {
    validateDocument(data);
    history.handleAdopt(data, "adopt");
    markSaved(isSaved ? history.current.current.present.revision : undefined);
    persistRecovery(isSaved ? undefined : data);
    setRecovery(undefined);
    latest.current.interaction.handleAdopted(undefined, "adopted");
  };
  const confirmDiscard = (message: string) =>
    !hasUnsavedRevision(history.current.current, saved.current) ||
    window.confirm(message);
  const handleSave = async () => {
    if (saving.current) return;
    if (history.current.current.preview) {
      status("Finish the current drag before saving.");
      return;
    }
    const source = history.current.current.present.data;
    const snapshot = captureLayout(
      source,
      latest.current.interaction.view.scale,
    );
    if (snapshot !== source) history.handleChange(snapshot, "change");
    const { present, session } = history.current.current;
    saving.current = true;
    setBusy(true);
    try {
      const response = await fetch("/api/designer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(present.data),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      if (history.current.current.session !== session) return;
      markSaved(present.revision);
      setRecovery(undefined);
      persistRecovery(recoverable());
      status("Saved - " + result.file);
    } catch (error) {
      if (history.current.current.session === session)
        status(
          `Save failed: ${error instanceof Error ? error.message : String(error)}`,
        );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  const handleOpen: HandlerKey<number, "open", Promise<void>> = async (id) => {
    if (!confirmDiscard("Discard unsaved changes and open this composition?"))
      return;
    const request = ++openRequest.current,
      { session, present } = history.current.current;
    try {
      const response = await fetch(`/api/designer?id=${id}`),
        data = await response.json();
      if (!response.ok) throw Error(data.error);
      if (
        request !== openRequest.current ||
        history.current.current.session !== session
      )
        return;
      if (
        history.current.current.present.revision !== present.revision &&
        !confirmDiscard(
          "Discard changes made while the composition was loading?",
        )
      )
        return;
      adopt(data, true);
      status("Opened saved composition");
      openDialog.current?.close();
    } catch (error) {
      if (request === openRequest.current)
        status(
          `Open failed: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
  };
  const handleAction: DesignerProps["handleAction"] = (payload, type) => {
    if (!payload || !type) return;
    const data = history.current.current.present.data;
    switch (type) {
      case "new": {
        if (payload.value === undefined) {
          newDialog.current?.showModal();
          return;
        }
        const mode = payload.value as DesignerMode;
        if (!["canvas", "dev", "view"].includes(mode)) return;
        if (
          !confirmDiscard(
            "Discard unsaved changes and create a new composition?",
          )
        )
          return;
        adopt({ ...newDocument(mode), theme: readThemeTokens() }, false);
        newDialog.current?.close();
        status(
          `New ${mode === "canvas" ? "Layout" : mode === "view" ? "View" : "Dev"} composition`,
        );
        return;
      }
      case "save":
        void handleSave();
        return;
      case "open":
        void fetch("/api/designer")
          .then(async (response) => {
            const rows = await response.json();
            if (!response.ok) throw Error(rows.error);
            setFiles(rows);
            openDialog.current?.showModal();
          })
          .catch((error) => status(`Open failed: ${error.message}`));
        return;
      case "export":
        download(
          JSON.stringify(
            captureLayout(data, latest.current.interaction.view.scale),
            null,
            2,
          ),
          `${data.id}.json`,
          "application/json",
        );
        return;
      case "export-html":
      case "export-component": {
        const selected = locate(
          data.children,
          latest.current.interaction.selected,
        )?.node;
        const code = siteCode(
          data,
          type === "export-component" ? selected : undefined,
          data.mode === "view" ? gridCSS : "",
        );
        download(
          type === "export-html" ? code.page : code.component,
          type === "export-html"
            ? "site.html"
            : `${selected?.className ?? "composition"}.jsx`,
          type === "export-html" ? "text/html" : "text/plain",
        );
        return;
      }
    }
  };
  const handleRecover: HandlerKey<undefined, "recover", void> = () => {
    if (
      !recovery ||
      !confirmDiscard("Discard unsaved changes and restore recovered work?")
    )
      return;
    adopt(recovery, false);
    status("Recovered unsaved composition");
  };
  return {
    busy,
    dirty,
    files,
    recovery,
    newDialog,
    openDialog,
    handleAction,
    handleOpen,
    handleRecover,
  };
}
