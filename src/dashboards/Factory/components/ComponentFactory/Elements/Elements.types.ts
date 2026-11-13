import type { HouseKeys } from "../../../../../HouseKeys.types";
import type { useComponentFactory } from "../hooks/useComponentFactory/useComponentFactory";

export interface ElementsProps extends HouseKeys {
  editor: ReturnType<typeof useComponentFactory>;
  className?: string;
}
