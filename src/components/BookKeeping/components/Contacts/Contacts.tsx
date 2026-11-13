import "../../../../atoms/actions/action-main/action-main.css";
import { useContacts } from "./hooks/useContacts/useContacts";
import { fields, list } from "./js/contact-fields";
import { Calendar } from "../../../Calendar/Calendar";
import { SearchBar } from "../../../SearchBar/SearchBar";
import { StatelesssForm } from "../../../StatelesssForm/StatelesssForm";
import { Expenses } from "../Expenses/Expenses";
import type { ContactsProps } from "./Contacts.types";
import "./css/contacts.css";

export const Contacts = (props: ContactsProps) => {
  const { items = [], selected, mode = "record", appointments, appointment_date, expenses, className, is_visible, handleSelect, handleClick, handleSubmit, handleCancel } = props;
  const { rows, setQuery } = useContacts(items);
  if (is_visible === false) return null;

  const contact = items.find((item) => item.id === selected);
  const editing = mode === "edit" ? contact : undefined;

  return (
    <section aria-label="Contacts" className={["contacts", "container-cell", className].filter(Boolean).join(" ")} data-grid="side-left">
      <div data-area="side" data-grid="header-main" className="contacts-sidebar container-cell container-cell--inset">
        <header data-area="header">
          <h2>Contacts</h2>
          <button type="button" className="action-main" onClick={() => handleClick?.(undefined, "contact-new", props)}>Add contact</button>
          <SearchBar handleChange={(data) => setQuery(data?.search ?? "")} />
        </header>
        <div data-area="main" className="contacts-scroll">
          {rows.length === 0 && <p>No contacts found.</p>}
          <ul>
            {rows.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={item.id === selected ? "action-main is-active" : "action-main"}
                  aria-pressed={item.id === selected}
                  onClick={() => handleSelect?.(item.id, "contact", props)}
                >
                  {item.label ?? item.title ?? item.name ?? item.id}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div data-area="main" className="contacts-scroll">
        {(mode === "new" || editing) ? (
          <StatelesssForm key={editing?.id ?? "new"}>
            <form onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const draft = {
                ...editing,
                ...Object.fromEntries(fields.map((field) => [field, String(data.get(field) ?? "")])),
                phones: list(data.get("phones")),
                tags: list(data.get("tags")),
                is_private: data.has("is_private"),
              };
              handleSubmit?.(draft, editing ? "contact-edit" : "contact-new", props);
            }}>
              <h3>{editing ? "Edit contact" : "New contact"}</h3>
              {fields.map((field) => (
                <p key={field}><label>{field} <input name={field} defaultValue={String(editing?.[field] ?? "")} /></label></p>
              ))}
              <p><label><input name="is_private" type="checkbox" defaultChecked={editing?.is_private} /> Private</label></p>
              <button type="submit" className="action-main">Save contact</button>{" "}
              <button type="button" className="action-main" onClick={() => handleCancel?.(editing, editing ? "contact-edit" : "contact-new", props)}>Cancel</button>
            </form>
          </StatelesssForm>
        ) : contact ? (
          <>
            <h3>{contact.label ?? contact.title ?? contact.name ?? contact.id}</h3>
            <button type="button" className="action-main" onClick={() => handleClick?.(contact, "contact-edit", props)}>Edit contact</button>
            <dl>
              {fields.map((field) => contact[field] === undefined ? null : (
                <div key={field}><dt>{field}</dt><dd>{String(contact[field])}</dd></div>
              ))}
              {contact.is_private !== undefined && <div><dt>Private</dt><dd>{contact.is_private ? "Yes" : "No"}</dd></div>}
            </dl>
            {appointments && <Calendar events={appointments} value={appointment_date} handleSelect={(data, type) => handleSelect?.(data, type, props)} />}
            {expenses && <Expenses {...expenses} />}
          </>
        ) : <p>Select a contact.</p>}
      </div>
    </section>
  );
};


