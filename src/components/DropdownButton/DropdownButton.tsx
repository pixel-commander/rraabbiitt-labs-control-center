import { useId, useRef } from "react";
import type { DropdownButtonProps } from "./DropdownButton.types";
import "./css/dropdown-button.css";
import "../../atoms/containers/container-dropdown/container-dropdown.css";

/** BAD CODE: 
 * an example or poorly structured code
export const DropdownButton = (props: DropdownButtonProps) => {
  const { title, label, Icon, children, is_open = false, is_closed = false,
    button_class = "action-light", dropdown_class = "container-dropdown pad", className = "" } = props;
  const root = useRef<HTMLDivElement>(null);
  const opened = useRef(is_open);
  const panelId = useId();
  const open = !is_closed && (is_open || opened.current);
  return (
    <div ref={root} className={["dropdown-button", open ? "is-open" : "is-closed", className].filter(Boolean).join(" ")}>
      <button type="button" className={["dropdown-button-trigger", button_class].filter(Boolean).join(" ")}
        disabled={props.disabled} aria-expanded={open} aria-controls={panelId}
        onClick={data => {
          if (!is_closed && root.current) {
            opened.current = !root.current.classList.contains("is-open");
            root.current.classList.toggle("is-open", opened.current);
            root.current.classList.toggle("is-closed", !opened.current);
            data.currentTarget.setAttribute("aria-expanded", String(opened.current));
          }
          return props.handleClick?.(data, "drop-down-button", props);
        }}>
        {Icon && <span className="dropdown-button-icon" aria-hidden="true">{Icon}</span>}
        {title ?? label}
      </button>
      <div id={panelId} className={["dropdown-button-panel", dropdown_class].filter(Boolean).join(" ")}>
        {children}
      </div>
    </div>
  );
};
*/

// GOOD CODE: well-structured and maintainable DropdownButton component
export const DropdownButton = ({
  title,
  label,
  Icon,
  children,
  is_open = false,
  is_closed = false,
  button_class = "action-light",
  dropdown_class = "container-dropdown pad",
  className = "",
  disabled,
  handleClick,
  ...props
}: DropdownButtonProps) => {
  const buttonProps: DropdownButtonProps = { ...props, title, label, Icon, children,
    is_open, is_closed, button_class, dropdown_class, className, disabled, handleClick };
  const panelId = useId();

  className += " dropdown-button";

  if (is_open && is_closed) console.warn("DropdownButton cannot be both open and closed")
  else {
    if (is_open) className += " is-open"
    if (is_closed) className += " is-closed"
  }

  const container_ref = useRef<HTMLDivElement>(null);

  const toggleSection = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (is_closed) return
    if (container_ref.current) {
      const isOpen = container_ref.current.classList.contains("is-open");
      container_ref.current.classList.toggle("is-open", !isOpen);
      container_ref.current.classList.toggle("is-closed", isOpen);
      event.currentTarget.setAttribute("aria-expanded", String(!isOpen));
    }
  }

  return (
    <div ref={container_ref} className={className}>
      <button type="button" className={["dropdown-button-trigger", button_class].filter(Boolean).join(" ")}
        disabled={disabled} aria-expanded={is_open} aria-controls={panelId}
        onClick={data => {
          toggleSection(data);
          return handleClick?.(data, "drop-down-button", buttonProps);
        }}>
        {Icon && <span className="dropdown-button-icon" aria-hidden="true">{Icon}</span>}
        {title ?? label}
      </button>
      <div id={panelId} className={["dropdown-button-panel", dropdown_class].filter(Boolean).join(" ")}>
        {children}
      </div>
    </div>
  );
};
