import "./css/icon-button.css";
import type { IconButtonProps } from "./IconButton.types";

const IconPlus = () => {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8 3v10M3 8h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const ICON_TYPES = { add: <IconPlus /> } as const;

export const IconButton = (props: IconButtonProps) => {
  const {
    children,
    Icon,
    type,
    disabled = false,
    action_atom = "action-main",
    className = "",
  } = props;
  const icon =
    Icon !== undefined && Icon !== null && Icon !== false
      ? Icon
      : type !== undefined && Object.hasOwn(ICON_TYPES, type)
        ? ICON_TYPES[type]
        : undefined;
  if (icon === undefined || icon === null) {
    console.warn("IconButton requires Icon or a valid type");
  }
  return (
    <button
      type="button"
      data-grid="side-right"
      className={["icon-button", action_atom, className]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled}
      title={props.title}
      aria-label={props.title}
      onClick={(event) => {
        if (!disabled) props.handleClick?.(event, "icon-button", props);
      }}
    >
      <span data-area="main" className="icon-button-content">
        {children}
      </span>
      {icon !== undefined && icon !== null && (
        <span data-area="side" className="icon-button-icon" aria-hidden="true">
          {icon}
        </span>
      )}
    </button>
  );
};
