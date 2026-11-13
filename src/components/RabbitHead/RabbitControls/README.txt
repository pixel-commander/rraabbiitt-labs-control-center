RabbitControls — component ID 1794534782424

Controlled child panel composed from FloatWindow ID 1793996465585 and Slider
ID 1794014810540. Render within a positioned parent with a defined height.
The demo owns settings, open state and window rectangle in useRabbitDemo.

Required: values (RabbitHeadRendererProps), rect, handleSlider and handleClick.
FloatWindow props including open, handleChange and handleClose pass through.
handleSlider receives (number, "slider", Slider props); props.name is the
renderer property key, not a registered entity lookup.
handleClick receives (action, "rabbit-control", complete panel props).
Actions: lightning, flood, arcs, showPulses, showSparkles, autoMotion, reset.
Also accepts useMono to toggle monochrome and {name, value} for a color change.
name is a renderer color prop, value is a hex string. Color pickers cover fill,
lines, pulses/sparks, circuit traces, arc core/glow, lightning, flood and mono.
Title defaults to Rabbit controls. className is composed with rabbit-controls.
No persistence; demo controls do not change application background settings.
Pulse sliders expose count (0–40), size (0.25–4), travel (1–20), and speed
(0.1–5), using handleSlider. The Pulses toggle enables the effect. Demo reset
restores count 14, size 1, travel 3 and speed 1, with pulses initially off.
