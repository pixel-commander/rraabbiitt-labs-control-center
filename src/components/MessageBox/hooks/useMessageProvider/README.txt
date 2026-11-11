useMessageProvider

Owns the message draft and submission forwarding. It performs no API, ranking or persistence work. Controlled values stay with the caller. The complete supplied callback bag is forwarded; a thrown submit error keeps the draft.

Props: the message-box prop bag; handleSubmit is required. value optionally controls the message; handleChange is optional. Defaults: empty local message, unless value is supplied. Callbacks: returned handleChange(text, type = message-box, bag = props) updates an uncontrolled message and forwards the change callback. Returned handleSubmit(text = message, type = message-box, bag = props) trims text, rejects blank input, invokes the submit callback with the complete supplied bag, and clears only an uncontrolled message. Returns message, handleChange and handleSubmit.

Style overrides on visual components use the inherited container/action class props, className, theme tokens, or parent CSS. The top-level feature accepts no style props.
