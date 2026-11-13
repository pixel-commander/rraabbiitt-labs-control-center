import type { HandlerKey, HouseIdProps, HouseKeys } from "../../../../HouseKeys.types";
import type { CalendarEvent, CalendarView } from "../../../Calendar/Calendar.types";
import type { ExpensesProps } from "../Expenses/Expenses.types";

export interface ContactDraft extends HouseKeys {
  label?: string;
  phones?: string[];
  email?: string;
  website?: string;
  address?: string;
  tags?: string[];
  color?: string;
  icon?: string;
  is_private?: boolean;
}

export interface ContactItem extends ContactDraft {
  id: HouseIdProps;
}

export interface ContactsProps extends HouseKeys {
  items?: readonly ContactItem[];
  selected?: HouseIdProps | null;
  mode?: "record" | "new" | "edit";
  appointments?: CalendarEvent[];
  appointment_date?: number;
  expenses?: ExpensesProps;
  className?: string;
  is_visible?: boolean;
  handleSelect?: HandlerKey<HouseIdProps | CalendarEvent | CalendarView, "contact" | "calendar-event" | "calendar-date" | "calendar-previous" | "calendar-next" | "calendar-view", void, ContactsProps>;
  handleClick?: HandlerKey<ContactItem, "contact-new" | "contact-edit", void, ContactsProps>;
  handleSubmit?: HandlerKey<ContactDraft, "contact-new" | "contact-edit", void, ContactsProps>;
  handleCancel?: HandlerKey<ContactItem, "contact-new" | "contact-edit", void, ContactsProps>;
}


