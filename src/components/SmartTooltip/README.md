# SmartTooltip

## Purpose

SmartTooltip renders caller-provided React content in a portal attached to document.body. The caller supplies targetRef for the element whose pointer activity activates the tooltip. Portal placement lets the box escape clipping by overflow-hidden ancestors.

## Contract and integration

Positioning is written directly to the tooltip DOM, not kept in React position state. The arrow tracks the cursor along the edge. Placement accepts above, below, left, right, before, or after; the viewport may flip to the opposite physical side. Before/after follow horizontal pointer travel. title and content/children accept ReactNode. disabled returns null before mounting the portal/listeners; positionRef lets ChartTooltip supply a chart-point anchor.

Modal targets portal into their nearest dialog; other targets use document.body. This keeps tooltips in the modal top layer.
