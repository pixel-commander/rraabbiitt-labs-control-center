import type { HandlerKey, HouseIdProps, HouseKeys } from "../../../../HouseKeys.types";

export interface ExpenseItem extends HouseKeys {
  id: HouseIdProps;
  label?: string;
  value?: number;
  account?: string;
  method?: string;
  project?: string;
  reference?: string;
  tax?: number;
  status?: string;
  owner?: string;
  is_billable?: boolean;
  has_receipt?: boolean;
}

export interface ExpensesProps extends HouseKeys {
  items?: readonly ExpenseItem[];
  selected?: HouseIdProps | null;
  category?: string | null;
  threshold?: number;
  currency?: string;
  className?: string;
  is_visible?: boolean;
  handleSelect?: HandlerKey<HouseIdProps | null, "expense", void, ExpensesProps>;
  handleChange?: HandlerKey<string | null, "expense-category", void, ExpensesProps>;
}

