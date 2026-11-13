import { useState } from "react";
import { BookKeeping } from "../BookKeeping";
import type { ContactItem, ContactsProps } from "../components/Contacts/Contacts.types";

const expenses = [
  { id: 10, title: "Train fare", name: "Travel", value: 24, date: Date.UTC(2026, 10, 6), has_receipt: true },
  { id: 11, title: "Supply refund", name: "Supplies", value: -5, date: Date.UTC(2026, 10, 6) },
];
const initialContacts: ContactItem[] = [{ id: 1, label: "Alex Rivera", email: "alex@example.com" }];

export const Demo = () => {
  const [items, setItems] = useState(initialContacts);
  const [selected, setSelected] = useState<number | null>(1);
  const [mode, setMode] = useState<ContactsProps["mode"]>("record");
  const [expense, setExpense] = useState<number | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  return (
    <div className="demo container-demos">
      <BookKeeping
        contacts={{
          items,
          selected,
          mode,
          handleSelect: (id, type) => { if (type === "contact" && typeof id === "number") { setSelected(id); setMode("record"); } },
          handleClick: (_, type) => setMode(type === "contact-edit" ? "edit" : "new"),
          handleCancel: () => setMode("record"),
          handleSubmit: (draft) => {
            if (!draft) return;
            const id = draft.id ?? Date.now();
            setItems((current) => current.some((item) => item.id === id)
              ? current.map((item) => item.id === id ? { ...draft, id } : item)
              : [...current, { ...draft, id }]);
            setSelected(id);
            setMode("record");
          },
        }}
        expenses={{
          items: expenses,
          selected: expense,
          category,
          handleSelect: (id) => setExpense(id ?? null),
          handleChange: (name) => setCategory(name ?? null),
        }}
      />
    </div>
  );
};

