LoginBox
Adapted from Z:/stand-alone-react/ui/components/login-box; original preserved.
Props extend HouseKeys. selected: "login" (default) or "create"; parent owns view.
handleSelect(view, "login-view", props) requests a view change.
handleSubmit({email,password,name?}, "login" | "create", props); Google calls handleSubmit({}, "google", props).
Parent handles authentication, async errors, status and is_busy. No authentication service or successful-login claim is embedded. Never log passwords. Demos do not store submitted credentials.
disabled and is_busy disable actions. status renders in a live output. Both forms remain mounted so input values survive view changes.
className composes root; container_class defaults container-cell; action_class defaults action-main; input_class defaults empty and applies to fields.
Styling can be overridden through theme tokens, supplied class props, or parent/external CSS. Tokens: --login-box-color/input-background/input-border/status-color.
No custom hook or old form dependency required. Native required/email validation is used. No internal application state.
