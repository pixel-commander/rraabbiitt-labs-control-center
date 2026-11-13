DropdownButton: 1794538514756.
HouseKeys props plus title/label/Icon/children as ReactNode.
button_class defaults to action-light. dropdown_class defaults to container-dropdown pad.
is_open initializes the ref open. is_closed prevents toggling and forces closed.
No React state. Click toggles classes and aria-expanded through refs, then returns
handleClick?.(event, "drop-down-button", props). Callback still runs when is_closed.
Title takes precedence over label. Children are the dropdown contents.
