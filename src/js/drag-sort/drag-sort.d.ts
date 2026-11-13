import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";
export interface DragSortResult {
  ids: string[];
  from: number;
  to: number;
}
export interface DragSortProps extends HouseKeys {
  item_selector?: string;
  handleSort?: HandlerKey<DragSortResult, "drag-sort", void>;
}
export const defaultProps: Readonly<{ item_selector: string }>;
export const dragSort: (
  ref: HTMLElement | { current: HTMLElement | null } | null,
  props?: DragSortProps,
) => () => void;
export default dragSort;
