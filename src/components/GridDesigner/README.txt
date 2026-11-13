GridDesigner
Adapted from Z:/stand-alone-react/ui/components/grid-designer; original preserved.
Props extend HouseKeys. Required data: {rows, cols, rowTracks, colTracks, boxes}.
Tracks: {mode: "1fr" | "auto" | "manual", manual: CSS track size}.
Boxes extend HouseKeys with numeric id, r1/c1/r2/c2 (1-based inclusive), optional area.
Parent owns data and selected numeric box ID. Supply positive integer dimensions and valid nonoverlapping boxes.
handleChange(data, "grid-designer", props); handleSelect(id, "grid-box", props).
handleSave({name, description, data, css}, "grid-designer", props) may return a Promise. Parent owns saving; no API calls inside.
className composes the root; container_class defaults container-cell; cell_class defaults container-cell; action_class defaults action-main. disabled blocks edits.
Drawing, moving, resizing, manual tracks, device previews and CSS export retained. Imperative refs replaced by controlled data. Reset is a parent/demo action.
CSS export uses house data-grid/data-area selectors. Auto tracks distribute empty space in the empty editing surface.
Styling can be overridden through theme tokens, supplied class props, or parent/external CSS. Component tokens include --grid-designer-color/background/input-background/line/accent.
Only local gesture/dialog state lives in useGridDesigner. Fixed preview dimensions live in demo; device presets explicitly size the editing canvas.
