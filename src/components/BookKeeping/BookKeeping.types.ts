import type { ReactNode } from "react";
import type { HouseKeys } from "../../HouseKeys.types";
import type { ContactsProps } from "./components/Contacts/Contacts.types";
import type { ExpensesProps } from "./components/Expenses/Expenses.types";

export interface BookKeepingProps extends HouseKeys {
  contacts?: ContactsProps;
  expenses?: ExpensesProps;
  children?: ReactNode;
  className?: string;
}
