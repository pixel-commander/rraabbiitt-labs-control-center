import { useState } from "react";
import { fields } from "../../js/contact-fields";
import type { ContactItem } from "../../Contacts.types";

export const useContacts = (items: readonly ContactItem[]) => {
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const rows = items.filter((item) =>
    [...fields, "title" as const].some((field) => String(item[field] ?? "").toLowerCase().includes(search)),
  );
  return { rows, setQuery };
};

