import type { HandlerKey, HouseKeys } from "../../../../../HouseKeys.types";
import type { FactoryGridLayout } from "../ComponentFactory.types";
import type { useComponentFactory } from "../hooks/useComponentFactory/useComponentFactory";

export interface GridAreaSelectPopupProps extends HouseKeys {
  editor: ReturnType<typeof useComponentFactory>;
  handleSubmit?: HandlerKey<FactoryGridLayout, "grid-layout", void, GridAreaSelectPopupProps>;
  className?: string;
}
