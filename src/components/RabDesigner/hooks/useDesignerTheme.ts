import { readThemeTokens } from "../js/theme";
import { useLayoutEffect, useRef, useState } from "react";
import type { DesignerProps } from "../RABDesigner.types";
import { validateTheme } from "../js/appearance";
export function useDesignerTheme(props: DesignerProps) {
  const [message, setMessage] = useState("");
  const [draftColor, setDraftColor] = useState("#ff2ed1");
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    root.current
      ?.querySelectorAll<HTMLInputElement>("[data-token]")
      .forEach((input) => {
        if (document.activeElement !== input)
          input.value = props.data.theme?.[input.dataset.token!] ?? "";
      });
  }, [props.data.theme]);
  const change = (theme: Record<string, string>) => {
    try {
      validateTheme(theme);
      props.handleChange({ ...props.data, theme }, "change", { ...props });
      setMessage("Theme updated");
      return true;
    } catch (error) {
      setMessage(String(error));
      return false;
    }
  };
  const loadCurrent = () => change(readThemeTokens());
  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 1000000) throw Error("Theme exceeds 1 MB.");
      const value = JSON.parse(await file.text());
      change(value.theme ?? value);
    } catch (error) {
      setMessage(String(error));
    }
  };
  const exportTheme = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(props.data.theme ?? {}, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "theme.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return {
    root,
    message,
    change,
    loadCurrent,
    importFile,
    exportTheme,
    draftColor,
    setDraftColor,
  };
}
