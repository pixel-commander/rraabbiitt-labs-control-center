import { SearchBar } from "../../SearchBar/SearchBar";
import type { GraphSearchProps } from "./GraphSearch.types";
import "./css/graph-search.css";
export const GraphSearch = ({ className = "", ...props }: GraphSearchProps) => {
  return (
    <div className={["graph-search", className].filter(Boolean).join(" ")}>
      <SearchBar {...props} />
    </div>
  );
};
