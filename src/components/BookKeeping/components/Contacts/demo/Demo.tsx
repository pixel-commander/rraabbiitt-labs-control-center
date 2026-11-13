import { useState } from "react";
import { Contacts } from "../Contacts";
import type { ContactItem, ContactsProps } from "../Contacts.types";

const initial: ContactItem[] = [
  { id: 1, label: "Alex Rivera", email: "alex@example.com" },
  { id: 2, label: "Sam Lee", email: "sam@example.com" },
];

export const Demo = () => {
  const [items, setItems] = useState(initial);
  const [selected, setSelected] = useState<number | null>(1);
  const [mode, setMode] = useState<ContactsProps["mode"]>("record");

  return (
    <Contacts
      items={items}
      selected={selected}
      mode={mode}
      handleSelect={(id, type) => { if (type === "contact" && typeof id === "number") { setSelected(id); setMode("record"); } }}
      handleClick={(_, type) => setMode(type === "contact-edit" ? "edit" : "new")}
      handleCancel={() => setMode("record")}
      handleSubmit={(draft) => {
        if (!draft) return;
        const id = draft.id ?? Date.now();
        setItems((current) => [...current.filter((item) => item.id !== id), { ...draft, id }]);
        setSelected(id);
        setMode("record");
      }}
    />
  );
};

