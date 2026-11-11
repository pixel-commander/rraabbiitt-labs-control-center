Slider
Controlled range slider adapted from Z:/control-center/__shared/components/Slider.
Pass value and handleChange(value, "slider", props). The parent owns value; the component does not store it.
Defaults: min 0, max 100, step 1, value 0. threshold marks a limit and changes the default skin above it.
Supports pointer dragging and native keyboard range controls. is_disabled prevents changes; is_visible=false hides it.
className is appended to slider. slider_class defaults to slider-main; pass an empty string for no default skin.
Override styling through theme tokens, --slider-accent/--slider-warning/--slider-thumb tokens, className/slider_class, or parent/external CSS. color sets the accent CSS color. Uses the project's data-grid sides topology.
Only the demo owns state. No API, persistence, or package dependencies beyond React.
