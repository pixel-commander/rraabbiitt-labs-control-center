import { useEffect, useState } from "react";
import type { FactoryDocument } from "../components/ComponentFactory/ComponentFactory.types";
import { readComposition } from "../components/ComponentFactory/js/compositionTree";

/** A numeric URL hash identifies a database record, independently of scaffold IDs. */
export function useDatabaseComposition() {
  const [json, setJson] = useState<FactoryDocument>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [id, setId] = useState<number>();
  useEffect(() => {
    let request: AbortController | undefined;
    const load = async () => {
      request?.abort();
      const hash = window.location.hash.slice(1);
      setError(undefined);
      if (!/^\d+$/.test(hash)) { setId(undefined); setLoading(false); return; }
      const nextId = Number(hash);
      if (!Number.isSafeInteger(nextId) || nextId < 1) { setId(undefined); setError("Invalid composition ID in URL."); setLoading(false); return; }
      const controller = new AbortController();
      request = controller;
      setId(nextId); setLoading(true);
      try {
        const response = await fetch(`/api/factory/compositions/${nextId}`, { signal: controller.signal });
        const record = await response.json();
        if (!response.ok) throw Error(record.error || "Could not load composition.");
        const document = readComposition(record.composition);
        if (controller.signal.aborted) return;
        setJson({ ...document, name: record.name, title: record.title, description: record.description,
          type: record.type, path: record.path ?? document.path, composition_id: record.id });
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : String(failure));
      } finally { if (!controller.signal.aborted) setLoading(false); }
    };
    const sync = () => { void load(); };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => { request?.abort(); window.removeEventListener("hashchange", sync); window.removeEventListener("popstate", sync); };
  }, []);
  return { json, id, loading, error };
}
