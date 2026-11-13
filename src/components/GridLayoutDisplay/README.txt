GridLayoutDisplay

Pass the grid name as selected: side-left, side-right,
header-main, main-footer, shell, side-cols, or holy-grail.
The optional handleClick receives ({ grid }, "grid-select").
The parent owns selection. action_class styles the preview buttons and defaults
to action-ghost. Load the shared grid and action styles.
Use className, parent CSS, or the surface and border theme tokens to style
the display. Private GridSelectCell types live in GridLayoutDisplay.types.ts.
