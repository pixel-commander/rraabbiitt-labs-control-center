import { useEffect, useRef, useState } from "react";
import type {
  CodeEditAndViewProps,
  CodeFile,
} from "../../CodeEditAndView.types";
import type { CodeDiagnostic } from "../../CodeViewer/CodeViewer.types";
import { validateCode } from "../../js/validate-code/validate-code";
import { saveCodeFile } from "../../js/save-code-file/save-code-file";

export const useCodeEditAndView = (props: CodeEditAndViewProps) => {
  const {
    code = "",
    file = "untitled.tsx",
    language = file.split(".").at(-1) ?? "tsx",
    path,
    initialMode = "edit",
  } = props;
  const [state, setState] = useState({
    draft: code,
    saved: code,
    mode: initialMode,
    pending: false,
    diagnostics: [] as CodeDiagnostic[],
    message: "",
    error: "",
    selectedLine: undefined as number | undefined,
  });
  const revision = useRef(0);
  const lastEmitted = useRef<string | null>(null);
  const identity = useRef({ file, path });
  const busy = useRef(false);
  useEffect(
    () => () => {
      revision.current++;
    },
    [],
  );
  useEffect(() => {
    const sameDocument =
      identity.current.file === file && identity.current.path === path;
    identity.current = { file, path };
    if (sameDocument && lastEmitted.current === code) return;
    lastEmitted.current = null;
    revision.current++;
    setState((previous) => ({
      ...previous,
      draft: code,
      saved: code,
      diagnostics: [],
      message: "",
      error: "",
    }));
  }, [code, file, path]);
  const change = (data?: { code: string }) => {
    if (!data) return;
    const draft = data.code;
    lastEmitted.current = draft;
    revision.current++;
    setState((previous) => ({
      ...previous,
      draft,
      diagnostics: [],
      message: "",
      error: "",
      selectedLine: undefined,
    }));
    props.handleChange?.({ code: draft }, "code-change");
  };
  const check = async (save: boolean) => {
    if (busy.current || props.disabled) return;
    busy.current = true;
    const version = revision.current;
    const snapshot: CodeFile = { code: state.draft, file, language, path };
    setState((previous) => ({
      ...previous,
      pending: true,
      message: "",
      error: "",
    }));
    try {
      const basic = await validateCode(snapshot);
      const diagnostics = basic.some((item) => item.severity === "error")
        ? basic
        : [
            ...basic,
            ...((await props.handleValidate?.(snapshot, "validate-code")) ??
              []),
          ];
      if (version !== revision.current) return;
      setState((previous) => ({ ...previous, diagnostics }));
      if (diagnostics.some((item) => item.severity === "error")) {
        setState((previous) => ({
          ...previous,
          message: "Fix errors before saving.",
        }));
        return;
      }
      if (save) {
        await saveCodeFile(snapshot, props.handleSave);
        if (version !== revision.current) return;
        setState((previous) => ({
          ...previous,
          saved: snapshot.code,
          message: "Saved.",
        }));
      } else
        setState((previous) => ({
          ...previous,
          message: props.handleValidate
            ? "Validation passed."
            : "Syntax check passed. Project type checking is not connected.",
        }));
    } catch (error) {
      if (version === revision.current)
        setState((previous) => ({
          ...previous,
          error: error instanceof Error ? error.message : String(error),
        }));
    } finally {
      busy.current = false;
      setState((previous) => ({ ...previous, pending: false }));
    }
  };
  const revert = () => {
    change({ code: state.saved });
  };
  const navigate = (line: number) =>
    setState((previous) => ({ ...previous, selectedLine: line }));
  const setMode = (mode: "view" | "edit") =>
    setState((previous) => ({ ...previous, mode }));
  return {
    ...state,
    file,
    language,
    dirty: state.draft !== state.saved,
    change,
    revert,
    navigate,
    setMode,
    validate: () => check(false),
    save: () => check(true),
  };
};
