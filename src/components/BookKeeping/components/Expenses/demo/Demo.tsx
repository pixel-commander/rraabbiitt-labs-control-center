import { useState } from "react";
import { Expenses } from "../Expenses";

const items = [
  { id: 1, name: "Travel", title: "Train ticket", value: 30, has_receipt: true },
  { id: 2, name: "Supplies", title: "Supply refund", value: -5 },
];

export const Demo = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  return (
    <Expenses
      items={items}
      selected={selected}
      category={category}
      handleSelect={(id) => setSelected(id ?? null)}
      handleChange={(name) => setCategory(name ?? null)}
    />
  );
};
