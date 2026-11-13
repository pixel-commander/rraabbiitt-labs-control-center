Contacts receives items with numeric IDs and a selected ID. mode controls record,
new and edit views. Supply resolved appointments and an optional Expenses props
bag for the selected contact. appointment_date is a millisecond timestamp.

handleSelect receives the contact ID. handleClick requests new or edit mode,
handleSubmit emits the draft, and handleCancel requests returning to the record.
Callbacks receive (data, type, props). The caller saves drafts and switches modes.
Calendar selections also use handleSelect, with their calendar-* event type and the Contacts props bag.

className is appended to contacts. Customize action-main through theme tokens
and the layout through parent CSS.

