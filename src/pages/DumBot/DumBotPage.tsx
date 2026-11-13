import { useEffect } from "react";
import { useRabbitContext } from "../../components/RabbitHead/hooks/useRabbit/RabbitProvider";
import { HybridSearch } from "../../components/HybridSearch/HybridSearch";
import type { HybridSearchProps } from "../../components/HybridSearch/HybridSearch.types";
import "./css/dum-bot.css";

export const DumBotPage = (props: HybridSearchProps) => {
  const { handleSettings } = useRabbitContext();
  useEffect(() => {
    handleSettings({ panX: -0.72 });
    return () => handleSettings({ panX: 0.65 });
  }, [handleSettings]);
  return <HybridSearch {...props} mode="dumbot" className="dum-bot" />;
};
