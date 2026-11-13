Pass flow data with nodes and edges, and optional shapes, notes and type colors.
Nodes use the editor's board coordinates. Supply selected to highlight an item.
The board pans on empty-space drag and zooms around the wheel pointer.
Dragging or resizing an item emits the next data via handleChange. Clicking
emits handleSelect. Ctrl+S or Cmd+S on the canvas emits handleSave.
All three receive (data, "canvas-flow", props). The caller owns data and saving.

Set the canvas size from its parent. className adds caller styling and the
canvas CSS variables control its drawing palette.

For reuse outside this component, js/flow-connectors.js exports straightPath,
orthoPath, curvePath, and createFlowConnectors(ctx, resolveToken). The factory
returns independent elasticPath, drawCable, makeBolt, drawBolt and drawFx
functions. Call step once per animation frame for animated effects.
