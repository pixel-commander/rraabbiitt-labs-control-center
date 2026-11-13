import { useEffect, useState } from "react";
export interface AuditData {
  totalCalls: number; updated: number;
  tools: { id: number; name: string; calls: number; first: number; last: number }[];
  days: { date: string; calls: number; runs: number }[];
  hours: { date: string; calls: number; runs: number }[];
  runs: { id: number; name: string; status: string; start: number | null; end: number | null; steps: number | null; warnings?: number }[];
}
export const useWorldStates = () => {
  const [data, setData] = useState<AuditData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const response = await fetch("/api/tool-usage", { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]) });
        const value = await response.json();
        if (!response.ok) throw Error(value.error ?? "Could not read usage records.");
        if (!controller.signal.aborted) { setData(value); setError(""); }
      } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not read usage records."); }
    };
    void refresh();
    const timer = window.setInterval(refresh, 10000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, []);

  console.log({data})
  return { data, error };
};
