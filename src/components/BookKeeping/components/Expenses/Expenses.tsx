import { SearchableSelect } from "../../../SearchableSelect/SearchableSelect";
import { StatCells } from "../../../StatCells/StatCells";
import "../../../../atoms/actions/action-main/action-main.css";
import type { ExpensesProps } from "./Expenses.types";
import "./css/expenses.css";

const detailFields = ["status", "account", "method", "project", "owner", "reference", "tax", "description"] as const;

export const Expenses = (props: ExpensesProps) => {
  const { items = [], selected, category = null, threshold, currency = "USD", className, is_visible, handleSelect, handleChange } = props;
  if (is_visible === false) return null;

  const categories = [...new Set(items.flatMap(({ name }) => name === undefined ? [] : [name]))];
  const categoryOptions = [
    { id: 0, name: "All" },
    ...categories.map((name, index) => ({
      name: name || "(Empty category)",
      id: index + 1,
    })),
  ];
  const rows = category === null ? items : items.filter(({ name }) => name === category);
  const totals = rows.reduce(({ spend, credit, largest }, { value = 0 }) => ({
    spend: spend + Math.max(0, value),
    credit: credit + Math.min(0, value),
    largest: Math.max(largest, value),
  }), { spend: 0, credit: 0, largest: 0 });
  const money = (value: number) => {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
    } catch {
      return value.toFixed(2);
    }
  };

  return (
    <section aria-label="Expenses" className={["expenses", "container-cell", className].filter(Boolean).join(" ")} data-grid="shell">
      <header data-area="header">
        <h2>Expenses</h2>
        <StatCells
          className="expenses-totals"
          size="sm"
          cells={[
            { title: "Spend", value: money(totals.spend) },
            { title: "Credit", value: money(-totals.credit) },
            { title: "Largest", value: money(totals.largest) },
            { title: "Count", value: rows.length },
          ]}
        />
        {categories.length > 0 && (
          <SearchableSelect
            label="Category"
            data={categoryOptions}
            selected={categoryOptions[category === null ? 0 : categories.indexOf(category) + 1]}
            searchable={false}
            handleClick={(option) => {
              if (option?.id !== undefined) handleChange?.(categories[option.id - 1] ?? null, "expense-category", props);
            }}
          />
        )}
      </header>
      <div data-area="main" className="scroll-y">
        <div className="expenses-ledger">
          {rows.length === 0 && <p>No expenses.</p>}
          {rows.map((item) => {
            const open = item.id === selected;
            const amount = item.value ?? 0;
            return (
              <article key={item.id}>
                <button
                  type="button"
                  className={open ? "expense-row action-main is-active" : "expense-row action-main"}
                  data-grid="side-right"
                  aria-expanded={open}
                  onClick={() => handleSelect?.(open ? null : item.id, "expense", props)}
                >
                  <span data-area="main">
                    <strong>{item.label ?? item.title ?? item.name ?? item.id}</strong>
                    <small>{item.name}{item.date !== undefined && <> · {new Date(item.date).toLocaleDateString()}</>}</small>
                  </span>
                  <span data-area="side">
                    <strong>{money(amount)}</strong>
                    {threshold !== undefined && amount >= threshold && <small>At or over threshold</small>}
                  </span>
                </button>
                {open && (
                  <dl>
                    {detailFields.map((field) => item[field] === undefined ? null : (
                      <div key={field}><dt>{field}</dt><dd>{field === "tax" ? money(item.tax ?? 0) : item[field]}</dd></div>
                    ))}
                    {item.is_billable !== undefined && <div><dt>Billable</dt><dd>{item.is_billable ? "Yes" : "No"}</dd></div>}
                    {item.has_receipt !== undefined && <div><dt>Receipt</dt><dd>{item.has_receipt ? "Yes" : "No"}</dd></div>}
                  </dl>
                )}
              </article>
            );
          })}
        </div>
      </div>
      <footer data-area="footer" data-grid="side-right"><span data-area="main">Net total</span><strong data-area="side">{money(totals.spend + totals.credit)}</strong></footer>
    </section>
  );
};

