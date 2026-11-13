import "./css/header.css";
import type { HeaderProps } from "../ComponentFactory.types";

export const Header = (props: HeaderProps) => {
  const { component_name, handleChange, handleClick, handleViewJson } = props;
  return (
    <header data-grid="sides" className="component-factory-header">
      <div data-area="left">Component Factory</div>
      <input
        data-area="main"
        type="text"
        aria-label="Component name"
        placeholder="Component name"
        value={component_name ?? ""}
        onChange={(event) => handleChange?.(event.target.value, "component-name", props)}
      />
      <div data-area="right" data-cols="5" data-gap="control">
        <button
          type="button"
          className="action-main"
          onClick={() => handleClick?.({}, "new", props)}
        >
          New
        </button>
        <button
          type="button"
          className="action-main"
          onClick={() => handleClick?.({}, "open", props)}
        >
          Open
        </button>
        <button
          type="button"
          className="action-main"
          onClick={() => handleClick?.({}, "export", props)}
        >
          Export JSON
        </button>
        <button type="button" className="action-main" onClick={handleViewJson}>
          View JSON
        </button>
        <button
          type="button"
          className="action-accent"
          onClick={() => handleClick?.({}, "save", props)}
        >
          Save composition
        </button>
      </div>
    </header>
  );
};
