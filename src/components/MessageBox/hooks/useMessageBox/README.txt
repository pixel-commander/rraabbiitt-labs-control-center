useMessageBox

Props: complete message-box props; handleSubmit is required. Defaults: uncontrolled empty message, or supplied value. Returns inputId, value, handleChange(event) for the textarea, handleKeyDown(event) for Enter submission (Shift+Enter adds a new line; IME composition does not submit), and handleSubmit(event) for the form. The event adapters delegate to the message provider; callbacks receive text, message-box and the complete incoming props bag.
