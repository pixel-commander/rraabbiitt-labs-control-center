import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";
export type DatePickerSelection = [number, number];
export interface DatePickerProps extends HouseKeys {
  selected?: DatePickerSelection;
  label?: string;
  className?: string;
  select_class?: string;
  dropdown_class?: string;
  cell_class?: string;
  is_open?: boolean;
  is_disabled?: boolean;
  is_visible?: boolean;
  handleSelect?: HandlerKey<
    DatePickerSelection,
    "date-picker",
    void,
    DatePickerProps
  >;
}
