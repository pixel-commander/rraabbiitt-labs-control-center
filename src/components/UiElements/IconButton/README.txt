IconButton
==========

Use children for the left content. Supply Icon as an optional ReactNode.
Alternatively, supply type. Its permitted keys come from ICON_TYPES.
The add key uses IconPlus. An explicit Icon takes priority over type.
The component warns if neither supplies an icon.
The side-right grid places the icon in the right column.
Both columns align at the vertical center. The text aligns left.
The grid has 1fr auto columns, as specified by the side-right topology.

Props extend HouseKeys. action_atom defaults to action-main.
An empty action_atom removes the default skin. className is added to icon-button.
disabled defaults to false. A disabled button does not call handleClick.
handleClick receives the mouse event, "icon-button", and the complete props bag.
Use title to supply an accessible label when the button has no visible text.
The icon is decorative. Put the accessible text in children or title.

The component owns no state. The parent owns the action.
Use theme tokens, action_atom, className or parent CSS for style overrides.
