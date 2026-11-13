import { Contacts } from "./components/Contacts/Contacts";
import { Expenses } from "./components/Expenses/Expenses";
import type { BookKeepingProps } from "./BookKeeping.types";
import "./css/book-keeping.css";

export const BookKeeping = ({ contacts, expenses, children, className }: BookKeepingProps) => {
  return (
    <div className={["book-keeping", className].filter(Boolean).join(" ")}>
      {contacts && <Contacts {...contacts} />}
      {expenses && <Expenses {...expenses} />}
      {children}
    </div>
  );
};
