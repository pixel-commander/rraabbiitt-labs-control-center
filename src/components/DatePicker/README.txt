DatePicker
Adapted from Z:/control-center/__shared/components/DatePicker.
selected is an optional [start, end] timestamp pair in milliseconds, including 0. No string dates.
handleSelect([start, end], "date-picker", props) reports local midnight for the chosen date. The parent owns selected.
Date arithmetic uses local calendar days, not fixed 24-hour increments, so daylight-saving transitions retain every date cell.
Open/month UI state lives in useDatePicker. Optional is_open overrides internal visibility; when supplied, the parent must update it to open or close the popup. Supports is_disabled and is_visible.
Uses house grid attributes, button semantics, Escape dismissal and focus-leave dismissal.
className appends to the outer date-picker wrapper.
select_class appends to the select trigger. dropdown_class appends to the dropdown panel.
cell_class applies an action atom or custom class to every calendar cell. Selected cells and drag previews receive is-selected, with aria-pressed from the same selection value. Today receives is-active and aria-current="date", independently of selection.
Override via theme tokens, className/select_class/dropdown_class/cell_class, or parent/external CSS. No API or persistence.

Drag across date cells to select an inclusive range. selected and handleSelect accept [number, number], in milliseconds. Range endpoints are sorted and use local midnight. A click or keyboard activation returns [date, date]. Drag highlights a preview and commits once on release. Pointer cancellation or Escape discards the preview.
