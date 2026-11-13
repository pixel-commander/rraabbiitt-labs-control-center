Reusable stylers extracted from ComponentFactory.

<Stylers types={["color", "container", "action", "effect", "grid", "layout"]}
  values={values} handleChange={(change, type) => { /* update your model */ }} />

All children share StylerPanelProps. handleClick (choices) and handleChange
(choices and layout fields) receive {name, value}, the styler type, and props.
Use handleChange for updates; handleClick is optional for observing choices.
Values are controlled by the caller. types controls tab order and visibility.
An empty types array renders no panels. Individual stylers can be imported directly.

ColorStyler: small two-column theme swatches; SmartTooltip shows token names.
color_property defaults to color. Selection returns var(--token-name).
theme_tokens optionally supplies token values, otherwise project color slots are used.
Container/Action/EffectStyler: full-width atom preview rows, including None.
atoms optionally supplies lists; otherwise local project atoms are discovered.
GridStyler: existing GridLayoutDisplay; emits {name: "grid", value: gridName}.
LayoutStyler: display, horizontalAlign, verticalAlign, padding and radius choices.
Padding/radius are token suffixes (or "0"); the caller maps them to its own model.

Factory uses shared color and atom controls through its editor adapter.
Its advanced paint and layout controls remain available.
Live demo: /style-guide#stylers.
