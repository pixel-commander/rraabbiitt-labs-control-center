StatCells renders cells inside a grid wrapper. Add wrapper classes with
container_class or className. Each cell accepts a required ReactNode value,
optional ReactNode title and label, and optional cell_class for styling.

Use mode="alt" to apply the inset skin to the wrapper and the main skin to each cell.
Use pad="sm", pad="md", or pad="lg" to apply wrapper padding.
Use pad="none" to omit wrapper padding.
The gap follows wrapper padding when a padding size is supplied.
With pad="none", the gap stays at the md size (0.5em).
Use size="sm", size="md" (default), or size="lg" to scale the cell text.
