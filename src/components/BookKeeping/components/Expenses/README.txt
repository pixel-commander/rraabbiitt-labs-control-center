Expenses receives numeric IDs, values and millisecond date timestamps.
selected controls the open row. category is the expense name, or null for all.
currency defaults to USD. threshold marks rows at or above the supplied amount.

handleSelect reports a row ID or null on collapse. handleChange reports the
category or null for all. Both receive (data, type, props).
className is appended to expenses. Customize action-main through theme tokens
and the layout through parent CSS.
