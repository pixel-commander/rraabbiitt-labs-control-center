import type { SearchBarProps } from "./SearchBar.types";
import "./css/search-bar.css";
import "../../atoms/actions/action-outline/action-outline.css";

const getFormData = (form: HTMLFormElement) => {
  const data = new FormData(form);
  return { search: String(data.get("search") ?? "") };
};

export const SearchBar = (props: SearchBarProps) => {
  const {
    className = "",
    container_class = "container-cell container-cell--inset",
    input_class = "",
    auto_complete = false,
    handleSubmit,
    handleChange,
  } = props;
  const rootClass = `search-bar ${container_class} ${className}`;
  const inputClass = `search-bar__input ${input_class}`;
  return (
    <div className={rootClass}>
      <form
        data-grid="sides"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit?.(getFormData(event.currentTarget), "search-bar", props);
        }}
      >
        <span className="search-bar__icon" data-area="left" aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            focusable="false"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
        </span>
        <input
          className={inputClass}
          data-area="main"
          type="search"
          autoComplete={auto_complete ? "on" : "off"}
          name="search"
          placeholder="Search"
          aria-label="Search"
          onChange={(event) => {
            const form = event.currentTarget.form;
            if (form) handleChange?.(getFormData(form), "search-bar", props);
          }}
        />
        <input
          className="search-bar__submit action-outline"
          data-area="right"
          type="submit"
          value="Submit"
        />
      </form>
    </div>
  );
};
