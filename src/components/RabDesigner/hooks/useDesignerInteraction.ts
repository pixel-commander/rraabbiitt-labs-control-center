import { useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import type { HandlerKey } from "../../../HouseKeys.types";
import type {
  DesignerProps,
  DesignerTool,
  DesignerView,
} from "../RABDesigner.types";
import type { DesignerState } from "../js/appearance";
import type { DesignerHistory } from "./useDesignerHistory";
import { locate, removeNode, updateNodes } from "../js/document";
import { addViewElement } from "../js/viewGrid";
import { isHtml } from "../js/htmlModel";
import { clipboardType, copyObject, pasteObject } from "../js/clipboard";
interface InteractionProps {
  history: DesignerHistory;
  handlePersistence: DesignerProps["handleAction"];
}
export function useDesignerInteraction({
  history,
  handlePersistence,
}: InteractionProps) {
  const [previewState, setPreviewState] = useState<DesignerState>("normal");
  const [autoMode, setAutoMode] = useState(true);
  const [selected, setSelected] = useState<number>();
  const [tool, setTool] = useState<DesignerTool>("select");
  const [view, setView] = useState<DesignerView>({ x: 80, y: 120, scale: 1 });
  const [status, setStatus] = useState("Ready");
  const cancel = useRef<() => void>(() => {}),
    fit = useRef<() => void>(() => {}),
    zoom = useRef<(scale: number) => void>(() => {});
  const getData = () =>
    history.current.current.preview ?? history.current.current.present.data;
  const handleStatus: HandlerKey<string, "status", void> = (message) =>
    setStatus(message ?? "");
  const handleChange: DesignerProps["handleChange"] = (data, type, props) => {
    try {
      const revision = history.current.current.present.revision;
      history.handleChange(data, type, props);
      if (history.current.current.present.revision !== revision)
        setStatus("Unsaved changes");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  };
  const handleClipboard: HandlerKey<
    ClipboardEvent<HTMLElement>,
    "clipboard",
    void
  > = (event) => {
    if (!event) return;
    const target = event.target as Element;
    if (
      target.closest(
        'input,textarea,select,[contenteditable]:not([contenteditable="false"]),dialog,[popover],pre,code',
      )
    )
      return;
    const selection = window.getSelection();
    if (
      event.type !== "paste" &&
      selection?.toString() &&
      selection.anchorNode?.parentElement?.closest("pre,code") &&
      !target.closest(
        '.designer-layer,[data-node],[aria-label="Design canvas"]',
      )
    )
      return;
    try {
      if (event.type === "paste") {
        const result = pasteObject(
          getData(),
          event.clipboardData.getData(clipboardType) ||
            event.clipboardData.getData("text/plain"),
        );
        if (!result) return;
        event.preventDefault();
        handleChange(
          getData().mode === "view"
            ? addViewElement(getData(), selected, {
                ...result.node,
                "data-grid": undefined,
                "data-area": undefined,
              })
            : result.data,
          "change",
        );
        setSelected(result.node.id);
        setTool("select");
        setStatus(`Pasted ${result.node.title}`);
        return;
      }
      if (selected === undefined) return;
      const sourceNode = locate(getData().children, selected)?.node;
      if (
        getData().mode === "view" &&
        (sourceNode?.["data-grid"] || sourceNode?.["data-area"])
      ) {
        setStatus("Copy or cut content inside an area, not the page grid.");
        return;
      }
      const mode = event.type === "cut" ? "cut" : "copy",
        text = copyObject(getData(), selected, mode);
      if (!text) return;
      // Native clipboard events are synchronous: remove only after both writes succeed.
      event.clipboardData.setData("text/plain", text);
      event.clipboardData.setData(clipboardType, text);
      event.preventDefault();
      const title = locate(getData().children, selected)?.node.title;
      if (mode === "cut") {
        handleChange(
          { ...getData(), children: removeNode(getData().children, selected) },
          "change",
        );
        setSelected(undefined);
      }
      setStatus(`${mode === "cut" ? "Cut" : "Copied"} ${title}`);
    } catch (error) {
      event.preventDefault();
      setStatus(
        `Clipboard failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };
  const handleAction: DesignerProps["handleAction"] = (payload, type) => {
    if (!payload || !type) return;
    const data = getData();
    if (type === "escape") {
      cancel.current();
      setTool("select");
      setSelected(undefined);
      setPreviewState("normal");
      return;
    }
    if (type === "state") {
      setPreviewState(payload.value as DesignerState);
      return;
    }
    if (type === "auto") {
      setAutoMode(payload.value === 1);
      setTool("select");
      return;
    }
    if (type === "tool") {
      if (data.mode === "view" && payload.value === "box") return;
      if (payload.value === "text" && isHtml(data)) {
        const node = locate(data.children, selected)?.node;
        if (!node || (data.mode === "view" && node["data-grid"])) {
          setStatus("Select a div to add text.");
          return;
        }
        if (!node.content)
          handleChange(
            {
              ...data,
              children: updateNodes(data.children, node.id, {
                content: "Text",
              }),
            },
            "change",
          );
        setTool("select");
        setStatus("Edit the selected div text");
        requestAnimationFrame(() => {
          document
            .querySelector<HTMLButtonElement>(
              '[aria-label="Object inspector"] [data-tab="properties"]',
            )
            ?.click();
          document
            .querySelector<HTMLTextAreaElement>('[aria-label="Element text"]')
            ?.focus();
        });
        return;
      }
      setTool(payload.value as DesignerTool);
      return;
    }
    if (type === "fit") {
      fit.current();
      return;
    }
    if (type === "reset") {
      zoom.current(1);
      return;
    }
    if (type === "zoom") {
      zoom.current(Number(payload.value));
      return;
    }
    if (type === "delete") {
      const node = locate(data.children, selected)?.node;
      if (
        data.mode === "view" &&
        (node?.["data-grid"] || node?.["data-area"])
      ) {
        setStatus("Choose a house grid to change page areas.");
        return;
      }
      if (selected !== undefined) {
        handleChange(
          { ...data, children: removeNode(data.children, selected) },
          "change",
        );
        setSelected(undefined);
      }
      return;
    }
    if (type === "undo" || type === "redo") {
      history.handleHistory(undefined, type);
      setSelected(undefined);
      setStatus(type === "undo" ? "Undo" : "Redo");
      return;
    }
    handlePersistence(payload, type);
  };
  const handleKeyDown: HandlerKey<
    KeyboardEvent<HTMLElement>,
    "keydown",
    void
  > = (event) => {
    if (!event) return;
    if (event.defaultPrevented) return;
    const target = event.target as Element;
    if (target.closest("dialog")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      handleAction({}, "escape");
      return;
    }
    if (
      target.closest(
        'input,textarea,select,[contenteditable]:not([contenteditable="false"])',
      )
    )
      return;
    if ((event.ctrlKey || event.metaKey) && !event.altKey) {
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        handleAction({}, event.shiftKey ? "redo" : "undo");
      }
      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleAction({}, "save");
      }
    }
  };
  const handleAdopted: HandlerKey<undefined, "adopted", void> = () => {
    setSelected(undefined);
    setTool("select");
    setPreviewState("normal");
    requestAnimationFrame(() => fit.current());
  };
  const handleClick: DesignerProps["handleClick"] = (data) => setSelected(data?.id);
  const handleView: DesignerProps["handleView"] = (value) => {
    if (value) setView(value);
  };
  return {
    selected,
    tool,
    view,
    previewState,
    autoMode,
    status,
    handleStatus,
    handleChange,
    handleAction,
    handleClipboard,
    handleKeyDown,
    handleClick,
    handleView,
    handleAdopted,
    fit,
    zoom,
    cancel,
  };
}
export type DesignerInteraction = ReturnType<typeof useDesignerInteraction>;
