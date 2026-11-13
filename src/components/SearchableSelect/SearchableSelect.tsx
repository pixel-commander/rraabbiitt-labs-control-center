import type { SearchableSelectProps } from "./SearchableSelect.types";
import "./css/searchable-select.css";
import { useSearchableSelect } from "./hooks/useSearchableSelect/useSearchableSelect";

export const SearchableSelect = (props: SearchableSelectProps) => {
  const {
    children,
    className = "",
    container_class = "container-main",
    placeholder = "Selectâ€¦",
    label = "Select a record",
    selected,
    name,
    disabled = false,
    appearance = "default",
    searchable = true,
    status,
  } = props;
  const settings = {
    ...props,
    className,
    placeholder,
    label,
    disabled,
    appearance,
    searchable,
  };
  const {
    root,
    id,
    matches,
    handleToggle,
    handleClick,
    handleInput,
    handleKeyDown,
  } = useSearchableSelect(settings);
  return (
    <div
      ref={root}
      data-grid="shell"
      data-appearance={appearance}
      className={["searchable-select", container_class, className]
        .filter(Boolean)
        .join(" ")}
      onKeyDown={handleKeyDown}
    >
      <header data-area="header">
        <button
          data-select-stage
          data-grid="side-right"
          type="button"
          className={
            appearance === "text"
              ? "action-main action-main--text action-main--capitalize"
              : ["action-main", container_class, "pad"]
                  .filter(Boolean)
                  .join(" ")
          }
          aria-label={label}
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-controls={`${id}-panel`}
          disabled={disabled}
          onClick={handleToggle}
        >
          <span data-area="main" className="searchable-select-value">
            {(appearance === "text"
              ? (selected?.title ?? selected?.name)
              : selected?.name) ?? placeholder}
          </span>
          <svg
            data-area="side"
            className="searchable-select-chevron"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M4 6 8 10 12 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {name !== undefined && (
          <input
            type="hidden"
            name={name}
            value={selected?.name ?? ""}
            disabled={disabled}
          />
        )}
      </header>
      <div
        id={`${id}-panel`}
        data-select-panel
        className={container_class}
        hidden
      >
        {searchable && (
          <label className="searchable-select-search">
            <input
              type="search"
              className={[container_class, "pad"].filter(Boolean).join(" ")}
              defaultValue=""
              aria-label="Search options"
              placeholder="Search optionsâ€¦"
              autoComplete="off"
              onChange={handleInput}
              disabled={disabled}
              aria-controls={`${id}-options`}
            />
          </label>
        )}
        {status?.error && <p role="alert">{status.error}</p>}
        <div
          className="searchable-select-scroll scroll-y"
          id={`${id}-options`}
          role="listbox"
          aria-label={label}
          aria-busy={status?.pending ?? false}
        >
          {matches.map((record) => {
            const key = JSON.stringify([
              record.path,
              record.file,
              record.id,
              record.name,
            ]);
            const chosen =
              selected !== undefined &&
              selected.path === record.path &&
              selected.file === record.file &&
              selected.id === record.id &&
              selected.name === record.name;
            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={chosen}
                className={`action-main action-main--select-option${chosen ? " is-active" : ""}`}
                disabled={disabled || status?.pending}
                onClick={() =>
                  handleClick(record, "searchable-select", settings)
                }
              >
                <span>
                  {(appearance === "text"
                    ? (record.title ?? record.name)
                    : (record.name ?? record.title)) ?? "(unnamed)"}
                </span>
                {record.path && <small>{record.path}</small>}
              </button>
            );
          })}
        </div>
        {status?.pending ? (
          <p role="status">Searchingâ€¦</p>
        ) : (
          matches.length === 0 && <p role="status">No matches.</p>
        )}
      </div>
      <footer data-area="footer">{children}</footer>
    </div>
  );
};
