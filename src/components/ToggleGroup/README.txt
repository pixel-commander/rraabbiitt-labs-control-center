ToggleGroup

Controlled group of toggle buttons. Import ToggleGroup from ToggleGroup.tsx.

items accepts the TabNav item shape with numeric id, path, label, and optional Icon.
selected is the active item's path. The caller owns selection.
handleClick receives (item, "toggle-group", props).
title labels the group for assistive technology.
className adds a class to the root for styling overrides.
Colors, spacing, and focus styling use the active theme's CSS tokens.
