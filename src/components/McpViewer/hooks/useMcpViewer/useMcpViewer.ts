import { useEffect, useRef, useState } from "react";
import type { FloatWindowProps } from "../../../FloatWindow/FloatWindow.types";

export const useMcpViewer = () => {
  const [tools, setTools] = useState<{ name: string; description?: string }[]>([]);
  const [toolError, setToolError] = useState("");
  const [activity, setActivity] = useState<{ time: string; method: string; client: string; tool?: string; toolId?: number; status: string; runs?: { id?: number; name?: string; status: string; date_start?: number; date_end?: number; error?: string }[] }[]>([]);
  const [state, setState] = useState(() => ({
    open: false,
    status: "checking" as "checking" | "connected" | "disconnected",
    rect: { x: 24, y: 72, width: Math.min(680, window.innerWidth - 48), height: Math.min(680, window.innerHeight - 96) },
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
        if (!controller.signal.aborted) {
          setActivity(health.activity ?? []);
          setState(current => ({ ...current, status: response.ok && health.status === "ok" ? "connected" : "disconnected" }));
        }
      } catch {
        if (!controller.signal.aborted) setState(current => ({ ...current, status: "disconnected" }));
      }
    };
    void check();
    const timer = window.setInterval(check, state.open ? 2000 : 30000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [state.open]);
  useEffect(() => {
    if (!state.open) return;
    const controller = new AbortController();
    setTools([]);
    setToolError("");
    void (async () => {
      try {
        const response = await fetch("/mcp", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", "X-MCP-Client-Name": "MCP popup" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]),
        });
        const result = await response.json();
        if (!response.ok || result.error || !Array.isArray(result.result?.tools)) throw new Error(result.error?.message ?? "Could not load server tools.");
        if (!controller.signal.aborted) setTools(result.result.tools);
      } catch (error) {
        if (!controller.signal.aborted) setToolError(error instanceof Error ? error.message : "Could not load server tools.");
      }
    })();
    return () => controller.abort();
  }, [state.open]);
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
  return { ...state, tools, toolError, activity, buttonRef, windowRef, handleClick, handleClose, handleChange };
};
