GridCell
Stateless grid cell. Use styler="main", "alt", "inset", "float" or "metal" for class combinations.
Explicit container_class and cell_class override presets, including empty strings.
Omitting styler preserves the unstyled default; spreading STYLERS still works.
Props: children, className, data_area, container_class, cell_class, scroll, padding.
data_area applies to the outer wrapper. className composes with grid-cell.
scroll: x, y or both adds a third inner wrapper. Omit it for two wrappers.
padding: sm/md/lg applies pad-sm/pad-md/pad-lg to the outer wrapper only.
Other strings (such as 10px) apply inline padding to the outer wrapper only. Omitted padding adds none.
Parents supply dimensions. Presets supply classes only; caller imports the corresponding atom CSS.
Uses the house grid and padding/scroll utilities from the theme layout CSS.
Override via theme tokens, supplied class names, or parent/external CSS.
Caller owns padding inside children; inner cell and scroll wrappers add none.
