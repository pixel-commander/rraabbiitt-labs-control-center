useRabbit

The controller lives with RabbitHead. The shell owns one controller. The style-guide demo consumes it and renders controls only.
useRabbit({ values?, open?, rect? }) creates an independent controller. Values accept every
RabbitHeadRendererProps key, including all position, model, motion, surface, color and effect
props used by RabbitControls. Undefined initial values use demo defaults; false, 0 and "" survive.
Initial options are read on mount. Later updates go through handleSettings or setValues.

RabbitProvider accepts the same options plus children. Mount it once around the shell.
useRabbitContext returns that provider's controller; it throws outside the provider.
Render <RabbitHead {...rabbit.values} handleReady={rabbit.handleReady} />.
Keep decorative/interactive placement props on the component as appropriate for that seat.

Pages call handleSettings({ panX: -0.72, panY: 0, zoom: 0.8 }) to merge flat settings.
Undefined patch values are ignored. Calls preserve supplied false, 0 and empty-string values.
For transient effects use effects.current?.strike(), faceStrike(), storm(count, interval),
or typed runtime overrides such as effects.current?.circuits({ auto: true }).
Pass null to an override to return control to the settings. Pages should restore their own
changes and cancel their timers on unmount. DumBotPage demonstrates page-scoped placement.

Popup wiring: values, rect, open, handleSlider and handleClick go to RabbitControls;
handleChange updates setRect and handleClose updates setOpen(false).
handleClick accepts lightning, flood, arcs, reset, toggle names, or a color name/value pair.
handleReset cancels the arc timer, clears runtime setting overrides and restores initial values.
The popup arc burst clears after 1800 ms and its timer is canceled when the owner unmounts.
effects is also passed to existing search pages as rabbitEffects for their typing animation.
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