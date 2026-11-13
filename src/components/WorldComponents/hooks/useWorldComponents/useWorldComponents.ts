import { useEffect, useRef, useState } from "react";
import type { RefreshStatus } from "../../RefreshSystemButton/RefreshSystemButton.types";
import type { DropdownButtonProps } from "../../../DropdownButton/DropdownButton.types";
export const useWorldComponents = () => {
  const [state, setState] = useState({ status: "idle" as RefreshStatus, message: "", report: null as unknown });
  const pending = useRef(false);
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; if (timer.current) clearTimeout(timer.current); }; }, []);
  const handleClick: DropdownButtonProps["handleClick"] = async () => {
    if (pending.current) return;
    pending.current = true;
    if (timer.current) clearTimeout(timer.current);
    setState(current => ({ ...current, status: "refreshing", message: "Refreshing world metadata…" }));
    try {
      const response = await fetch("/api/world/refresh", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw Error(result.error ?? `Refresh request failed (${response.status}).`);
      const report = result.response;
      if (!report || !Array.isArray(report.branches)) throw Error("Invalid refresh report.");
      const status: RefreshStatus = report.status === "error" ? "error" : report.errors?.length ? "warning" : "success";
      if (mounted.current) setState({ status, report, message: report.errors?.join("; ") || "All branches completed. Run saved to database." });
    } catch (error) {
      if (mounted.current) setState({ status: "error", message: error instanceof Error ? error.message : String(error), report: null });
    } finally {
      pending.current = false;
      if (mounted.current) timer.current = setTimeout(() => setState(current => ({ ...current, status: "idle" })), 4000);
    }
  };
  return { ...state, handleClick };
};
