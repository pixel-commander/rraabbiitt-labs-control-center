import { HybridSearch } from "../../components/HybridSearch/HybridSearch";
import type { HybridSearchProps } from "../../components/HybridSearch/HybridSearch.types";
import "./css/dum-bot.css";

export const DumBotPage = (props: HybridSearchProps) => {
  return <HybridSearch {...props} mode="dumbot" className="dum-bot" />;
};
