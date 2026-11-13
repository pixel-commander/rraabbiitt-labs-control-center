MessageBox
==========

Use MessageBox to submit message text.
Press Enter to submit. Press Shift+Enter to add a new line.
Enter during IME composition does not submit. Held Enter does not repeat submission.
handleSubmit is required. It receives trimmed text, "message-box", and the complete incoming props bag. Whitespace-only text cannot be submitted.

Props
  place_holder     Optional string. Default: Search your world…
  container_class  Optional string. Default: container-outline.
  submit_class     Optional string. Default: action-filled.
  children         Optional ReactNode in the bottom-left cell.
  className        Added to message-box.
  title            Accessible textarea label. Default: Message.
  value            Optional controlled text value.
  handleChange     Optional callback: text, "message-box", complete props.

Without value, the message provider owns the draft and clears it after submission. With value, the parent owns draft updates and clearing. Empty strings are preserved.

Layout
  Rows: 65px auto. Columns: 1fr auto.
  The textarea spans both columns in the first row.
  children occupy the bottom-left cell. Run occupies the bottom-right cell.
  The root owns padding and gap. No fixed outer preview width is applied.

Use theme tokens, container_class, submit_class, className, or parent CSS for style overrides. Native form submission is prevented. The component performs no network or storage operations.

Rephrase: MessageBox accepts optional handleClick(text, "rephrase", completeProps). When supplied, an outlined Rephrase button appears beside Run. DumBot owns this callback and previews the current draft through its model responder in the chat; no tool executes and the draft is preserved.
