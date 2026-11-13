import { useState } from "react";
import type { HandlerKey } from "../../../../HouseKeys.types";
import type { FactoryComposition } from "../../components/ComponentFactory/ComponentFactory.types";
import type { FactoryProps, FactorySaveData, FactorySaveResult, FactoryOverwriteConfirmation } from "../../Factory.types";
import { compositionCode } from "../../components/ComponentFactory/js/compositionCode";

export const useFactory = (props: FactoryProps) => {
  const [draft, setDraft] = useState<FactorySaveData>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState<FactorySaveResult>();
  const [savedName, setSavedName] = useState<string>();
  const [complete, setComplete] = useState(false);
  const [confirmation, setConfirmation] = useState<FactoryOverwriteConfirmation>();

  const openSave = async (composition?: FactoryComposition, _type?: "save", bag?: FactoryProps) => {
    if (!composition || pending) return;
    setPending(true);
    setError(undefined);
    setComplete(false);
    setConfirmation(undefined);
    try {
      const response = await fetch("/api/factory/save");
      const context = await response.json();
      if (!response.ok) throw Error(context.error || "Could not load save settings.");
      const previous = composition.name === savedName ? saved : undefined;
      setDraft({
        id: composition.id ?? previous?.id,
        name: previous?.name ?? composition.name ?? "",
        title: composition.title ?? previous?.title ?? props.title ?? composition.name ?? "",
        path: previous?.path ?? composition.path ?? bag?.path ?? props.path ?? context.path,
        type: previous?.type === "subcomponent" || previous?.type === "page" || previous?.type === "dashboard" ? previous.type : composition.type === "subcomponent" || composition.type === "page" || composition.type === "dashboard" ? composition.type : "component",
        destinations: context.paths,
        description: composition.description ?? previous?.description ?? props.description ?? "",
        composition,
      });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setPending(false);
    }
  };

  const handleSave: HandlerKey<FactorySaveData, "component-runner", Promise<void>, FactoryProps> = async (data, type) => {
    if (!data || type !== "component-runner" || pending) return;
    setPending(true);
    setError(undefined);
    setDraft(data);
    setConfirmation(undefined);
    try {
      const { code, css } = compositionCode({ ...data.composition, name: data.name }, "jsx");
      const response = await fetch("/api/factory/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, code, css, save_type: type }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Save failed.");
      if (result.requires_confirmation) {
        setConfirmation(result);
        return;
      }
      setSaved(result);
      setSavedName(data.composition.name);
      setComplete(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setPending(false);
    }
  };

  const closeSave = () => {
    if (!pending) setDraft(undefined);
  };

  return { draft, pending, error, saved, complete, confirmation, openSave, closeSave, handleSave };
};
