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

Copy settings copies the resolved current renderer values as formatted JSON to the clipboard.
The status reports success or clipboard failure. Values include provider settings and explicit value overrides.

Mouse follow sliders control followX and followY from 0 to 4 by 0.05. Defaults are 0.7 horizontally and 0.35 vertically. Zero stops following on that axis; higher values amplify rotation. Copy settings includes both values.

Glitch amount controls the renderer's existing horizontal shear bursts: 0 to 5 by 0.25, default 1. Zero disables it. The renderer suppresses glitch in calm/reduced-motion mode. Burst duration and repeat interval are configurable. Copy settings includes glitch.

Glitch trigger and timing
------------------------
The Glitch button triggers one immediate burst, like Flood. Auto glitch defaults to false
in useRabbit so pages can trigger it externally without background bursts. Enable Auto glitch
for repeating bursts. Duration is milliseconds (default 252), interval is milliseconds
(default 4200), and amount remains 0 to 5. Zero amount or duration suppresses the effect.
All three values and autoGlitch are included in Copy settings.

Inside a page under RabbitProvider:
  const { effects } = useRabbitContext();
  effects.current?.glitch(); // use configured amount and duration
  effects.current?.glitch({ amount: 5, duration: 600 }); // one-off override
  effects.current?.glitch(null); // cancel the triggered burst

Repeated triggers restart the burst. They use the render clock and create no timers.
Cancellation leaves automatic mode unchanged; disable autoGlitch to stop repeating bursts.
Calm/reduced-motion mode suppresses glitch. Renderer-only consumers retain automatic behavior
unless autoGlitch is explicitly false. Nested settings.surface accepts glitchDuration,
glitchInterval and autoGlitch alongside glitch. Runtime surface overrides accept them too.