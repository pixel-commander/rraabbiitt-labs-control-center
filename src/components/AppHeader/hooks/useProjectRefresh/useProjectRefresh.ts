import { useRef, useState } from "react";

export const useProjectRefresh = () => {
  const running = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const handleRefresh = async () => {
    if (running.current) return;
    running.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/refresh-project", { method: "POST" });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Project refresh failed.");
      window.location.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      running.current = false;
      setPending(false);
    }
  };
  return { pending, error, handleRefresh };
};
