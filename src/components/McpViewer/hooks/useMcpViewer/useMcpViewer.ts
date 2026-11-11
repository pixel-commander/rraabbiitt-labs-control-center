import { useEffect, useRef, useState } from "react";
import type { FloatWindowProps } from "../../../FloatWindow/FloatWindow.types";

export const useMcpViewer = () => {
  const [state, setState] = useState(() => ({
    open: false,
    status: "checking" as "checking" | "connected" | "disconnected",
    rect: { x: 24, y: 72, width: Math.min(560, window.innerWidth - 48), height: Math.min(360, window.innerHeight - 96) },
  }));
  const buttonRef = useRef<HTMLButtonElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    const check = async () => {
      try {
        const response = await fetch("/api/mcp/health", {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(2000)]),
        });
        const health = await response.json();
        if (!controller.signal.aborted)
          setState(current => ({ ...current, status: response.ok && health.status === "ok" ? "connected" : "disconnected" }));
      } catch {
        if (!controller.signal.aborted) setState(current => ({ ...current, status: "disconnected" }));
      }
    };
    void check();
    const timer = window.setInterval(check, 30000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, []);
  useEffect(() => {
    if (state.open) windowRef.current?.querySelector<HTMLButtonElement>(".float-window-close")?.focus();
  }, [state.open]);
  const handleClick = () => setState(current => ({ ...current, open: true }));
  const handleClose = () => {
    setState(current => ({ ...current, open: false }));
    buttonRef.current?.focus();
  };
  const handleChange: FloatWindowProps["handleChange"] = value => {
    if (value !== undefined) setState(current => ({ ...current, rect: value }));
  };
  return { ...state, buttonRef, windowRef, handleClick, handleClose, handleChange };
};
