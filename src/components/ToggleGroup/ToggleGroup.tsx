import type { ToggleGroupProps } from "./ToggleGroup.types";
import "./css/toggle-group.css";

export const ToggleGroup = (props: ToggleGroupProps) => {
  const { items, selected, handleClick, title, className } = props;

  return (
    <div className={["toggle-group", className].filter(Boolean).join(" ")} role="group" aria-label={title}>
      {items?.map((item) => (
        <button
          key={item.id}
          type="button"
          className="toggle-group__item"
          aria-pressed={selected === item.path}
          onClick={() => handleClick?.(item, "toggle-group", props)}
        >
          {item.Icon && <span aria-hidden="true">{item.Icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
};
