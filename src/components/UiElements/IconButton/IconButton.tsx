import type { ReactNode } from "react";
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

const renderIcon = (children: ReactNode, className?: string) => {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" focusable="false" className={className}>
      {children}
    </svg>
  );
};

const SkillIcon = () => {
  return renderIcon(<><path d="m2 9 10-5 10 5-10 5-10-5Z" /><path d="M6 11v6c4 3 8 3 12 0v-6M22 9v8" /></>);
};

const ToolIcon = () => {
  return renderIcon(<><path d="M14.5 6.5 18 3a6 6 0 0 0-7.5 7.5L3 18a2.1 2.1 0 0 0 3 3l7.5-7.5A6 6 0 0 0 21 6l-3.5 3.5-3-3Z" /><path d="m5 19 .01-.01" /></>);
};

const RunnerIcon = () => {
  return renderIcon(<><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4V8Z" /></>);
};

const DocIcon = () => {
  return renderIcon(<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" /><path d="M14 3v6h6M8 13h8M8 17h6" /></>);
};

const FindIcon = () => {
  return renderIcon(<><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>);
};

const SettingsIcon = () => {
  return renderIcon(<path d="M2 12h4l3-8 6 16 3-8h4" />, "icon-settings-pulse");
};

const BeaconIcon = () => {
  return renderIcon(<><path d="m7 8 9 9M6 9a7 7 0 0 0 9 9L6 9ZM8 19l-2 3M3 22h10M15 9l4-4M17 3a4 4 0 0 1 4 4M15 5a4 4 0 0 1 4 4" /></>);
};

export const ICONS = {
  skill: <SkillIcon />,
  tool: <ToolIcon />,
  runner: <RunnerIcon />,
  doc: <DocIcon />,
  find: <FindIcon />,
  settings: <SettingsIcon />,
  beacon: <BeaconIcon />,
} as const;

const StarIcon = () => {
  return renderIcon(<path d="m12 3 2.78 5.63L21 9.54l-4.5 4.39 1.06 6.2L12 17.2l-5.56 2.93 1.06-6.2L3 9.54l6.22-.91L12 3Z" />);
};
export const ICON_TYPES = { add: <IconPlus />, favorite: <StarIcon />, ...ICONS } as const;

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
