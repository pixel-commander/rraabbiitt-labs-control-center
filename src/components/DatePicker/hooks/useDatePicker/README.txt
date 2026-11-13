useDatePicker
Owns popover visibility and displayed month. Accepts the complete DatePickerProps bag, preserves numeric selected timestamps, and emits handleSelect with that same bag.
Does not render CSS; theme tokens, className or parent CSS customize the consuming DatePicker.

Drag across date cells to select an inclusive range. selected and handleSelect accept [number, number], in milliseconds. Range endpoints are sorted and use local midnight. A click or keyboard activation returns [date, date]. Drag highlights a preview and commits once on release. Pointer cancellation or Escape discards the preview.
