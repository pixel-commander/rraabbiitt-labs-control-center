RabbitHead
==========

Purpose
-------
RabbitHead renders the Rraabbiitt 3D head without the dashboard controls.
Use it inside a page, a card, an icon area, or a page background.
The component fills the size of its parent. Set the parent size or pass style.

Basic use
---------
  import { RabbitHead } from "./components/RabbitHead/RabbitHead";

  <RabbitHead
    model="rabbit-hi"
    settings={{
      colors: { line: "#7fe3ff", face: "#39e28e" },
      surface: { showPoints: false },
      view: { zoom: 1.2 }
    }}
  />

For a page background, position the component with style or with a parent class.
Set interactive={false} so the component does not receive pointer input.
Set transparentBg={true} to remove the dark background.

Example background placement:
  <section style={{ position: "relative", minHeight: 480 }}>
    <RabbitHead
      className="page-head-background"
      interactive={false}
      transparentBg={true}
      style={{ position: "absolute", inset: 0, opacity: 0.3, zIndex: 0 }}
    />
    <main style={{ position: "relative", zIndex: 1 }}>Page content</main>
  </section>

Props
-----

model: string
  Selects the head model. The built-in values are "rabbit-lo", "rabbit",
  "rabbit-hi", "rabbit-pro", "skull", "robot", and "brain". The default is "rabbit".
  A custom model can use the saved model key "custom:<index>" from the local
  model library.

settings: RabbitHeadSettings
  Supplies any subset of the nested settings listed below. Omitted fields use
  the renderer defaults. The component preserves supplied false, zero, and
  empty-string values. The direct renderer props listed later override the
  matching nested setting when both forms are supplied. A runtime override set
  through the effects object takes priority until that override is cleared.
  The parent owns the settings object. Pass a new object to change its values.

className: string
  Adds classes to the "rabbit-head" root class. Use this prop for a local style.

style: React.CSSProperties
  Sets inline CSS on the root. Use width and height to set the head size. The
  component does not select a fixed size.

interactive: boolean
  Enables pointer and wheel input. The default is true. Set false to disable
  pointer input. The animation continues when pointer input is disabled.

transparentBg: boolean
  Removes the default #020604 background and its scan-line and vignette layers.
  The default is false.

motion: "full" | "calm"
  Selects full motion or reduced motion. "calm" reduces automatic rotation and
  disables pulse-rider motion. The default is "full".

wheelZoom: boolean
  Enables wheel zoom. The default is true.

autoMotion: boolean
  Enables automatic head rotation. The default is true.

followMouse: boolean
  Enables head rotation that follows the pointer. The default is true.

followX: number
  Sets horizontal pointer-follow strength. The default is 0.7.

followY: number
  Sets vertical pointer-follow strength. The default is 0.35.

shading: "smooth" | "flat"
  Selects smooth or flat face shading. The default is "smooth".

handleReady: HandlerKey callback
  Receives `(effects, "rabbit-head", props)` when the renderer is ready. It
  receives `(null, "rabbit-head", props)` when the renderer unmounts. `props`
  is the complete incoming RabbitHead prop bag. Use this callback to retain
  the effects object. The callback uses the shared HandlerKey calling convention.

settings groups
---------------
All numeric ranges below are the dashboard control ranges. The renderer uses
the values supplied by props. Keep values inside these ranges for the same
behavior as the dashboard controls.

pulses
  on: Show moving line pulses. Default true.
  freq: Maximum concurrent pulses. Range 0 to 40. Step 1. Default 14.
  size: Pulse head, tail, and glow scale. Range 0.25 to 4. Step 0.25. Default 1.
  travel: Edge travel before a pulse ends. Range 1 to 20. Step 1. Default 3.
  speed: Pulse travel speed. Range 0.1 to 5. Step 0.1. Default 1.

sparkles
  on: Show sparkle riders. Default true.
  freq: Maximum concurrent sparkles. Range 0 to 40. Step 1. Default 8.
  size: Sparkle size scale. Range 0.25 to 4. Step 0.25. Default 1.
  travel: Edge travel before a sparkle ends. Range 1 to 20. Step 1. Default 6.
  speed: Sparkle travel speed. Range 0.1 to 5. Step 0.1. Default 1.
  amount: Dust amount left by sparkles. Range 0 to 1. Step 0.05. Default 0.5.

dust
  amount: Dust amount. Range 0 to 1. Step 0.05. Default 0.5.
  size: Dust size. Range 0.25 to 3. Step 0.25. Default 1.
  `dust.amount` takes precedence over `sparkles.amount` when both are set.

circuits
  on: Show circuit traces. Default true.
  density: Chance that a spark grows a trace. Default 0.55.
  count: Number of traces per spark. Default 2.
  length: Trace length multiplier. Default 1.
  opacity: Trace opacity. Range 0.05 to 1. Step 0.05. Default 0.22.
  speed: Trace growth and retraction speed. Range 0.25 to 4. Step 0.25. Default 1.
  auto: Enable ambient traces. Default false.
  rate: Concurrent ambient sparks. Range 1 to 40. Step 1. Default 10.
  glow: Trace halo strength. Range 0 to 1. Step 0.05. Default 0.4.
  jumps: Mesh points per trace. Range 1 to 14. Step 1. Default 4.
  hold: Trace linger amount. Range 0 to 1. Step 0.05. Default 0.4.
  dir: Trace direction in degrees. Range -180 to 180. Step 15. Default 0.
  step: Edges walked per jump. Range 1 to 4. Step 1. Default 1.

lightning
  auto: Enable automatic lightning. Default false.
  rate: Lightning events per minute. Range 1 to 120. Step 1. Default 12.
  arms: Branch count. Range 1 to 8. Step 1. Default 3.
  hops: Distance spread across the mesh. Range 4 to 60. Step 1. Default 22.
  speed: Lightning growth speed multiplier. Default 1.
  intensity: Brightness and line thickness multiplier. Range 0.25 to 3.
  fade: Segment display time in milliseconds. Range 200 to 3000. Step 100.
  Defaults for intensity and fade are 1 and 900 milliseconds.

flood
  auto: Enable automatic face floods. Default false.
  rate: Flood events per minute. Range 1 to 120. Step 1. Default 8.
  hops: Distance spread across the mesh. Range 4 to 60. Step 1. Default 22.
  speed: Flood travel speed. Default 1.
  intensity: Brightness multiplier. Range 0.25 to 3. Default 1.
  fade: Face display time in milliseconds. Range 200 to 3000. Step 100.
  The default fade time is 900 milliseconds.

hover
  glow: Add a glow near the pointer. Default false.
  sparks: Add sparks near the pointer. Default false.
  pulse: Add pulses near the pointer. Default false.
  circuit: Add circuit traces near the pointer. Default false.
  strike: Add lightning near the pointer. Default false.
  flood: Add face floods near the pointer. Default false.
  radius: Pointer effect radius in pixels. Range 30 to 240. Step 10. Default 90.
  strength: Pointer effect strength. Range 0.25 to 3. Step 0.25. Default 1.
  rate: Pointer event rate per second. Range 0.5 to 10. Step 0.5. Default 2.

colors
  mono: Use one color for the head. Default false. A color string also enables
  mono mode and sets the mono color.
  monoColor: Color used in mono mode. Default #4dff88.
  line: Mesh line color. Default #4dff88.
  face: Mesh face color. Default #39e28e.
  fx: Pulse and effect color. Default #4dff88.
  circuit: Circuit trace color. Defaults to the fx color.
  strike: Lightning color. Default #4dff88.
  flood: Face flood color. Default #4dff88.
  Color values are CSS hex color strings. The dashboard palette is #4dff88,
  #7fe3ff, #ff2b3a, #ffb84d, #c58fff, and #f5f0e8.

surface
  faceOpacity: Mesh face opacity. Range 0 to 1. Step 0.05. Default 0.96.
  lineOpacity: Mesh line opacity. Range 0 to 1. Step 0.05. Default 1.
  glitch: Vertex glitch amount. Range 0 to 3. Step 0.25. Default 1.
  pointSize: Mesh point size. Range 0 to 6. Step 0.25. Default 1.5.
  pointGlow: Mesh point glow. Range 0 to 1. Step 0.05. Default 0.
  showPoints: Show mesh points. Default true.

view
  zoom: Camera zoom. Dashboard range 0.3 to 3. Step 0.05. Default 1.
  panX: Horizontal camera offset. Dashboard range -1 to 1. Step 0.02. Default 0.

Direct renderer props
---------------------
RabbitHead also accepts the flat renderer prop names listed below. Use the
nested settings object for new integrations. A defined flat prop takes priority
over the matching field in settings.

Effect props:
  showPulses, pulseFreq, pulseSize, pulseTravel, pulseSpeed
  showSparkles, sparkleFreq, sparkleSize, sparkleTravel, sparkleSpeed
  dustAmount, dustSize
  showCircuits, circuitDensity, circuitCount, circuitLength, circuitOpacity,
  circuitSpeed, autoCircuits, circuitRate, circuitGlow, circuitJumps,
  circuitHold, circuitDir, circuitStep
  autoStrike, strikeRate, strikeArms, strikeSpread, strikeSpeed,
  strikeIntensity, strikeLength
  autoFlood, floodRate, floodTravel, floodSpeed, floodIntensity, floodLength
  hoverGlow, hoverSparks, hoverPulse, hoverCircuit, hoverStrike, hoverFlood,
  hoverRadius, hoverStrength, hoverRate

Color props:
  useMono, monoColor, lineColor, faceColor, fxColor, circuitColor,
  strikeColor, floodColor

Surface and view props:
  faceOpacity, lineOpacity, glitch, pointSize, pointGlow, showPoints, zoom, panX

Effects commands
----------------
The effects object passed to handleReady supports:
  strike(): Start one line lightning event.
  faceStrike(): Start one face flood event.
  storm(count, interval): Start `count` lightning events with the interval in
  milliseconds between events.
  model(name): Change the selected model.
  pulses(options), sparkles(options), dust(options), circuits(options),
  lightning(options), flood(options), hover(options), colors(options),
  surface(options), and view(options): Set a runtime override for one group.
  Pass null to a group method to clear that runtime override.

The options object uses the setting names from the matching group above.
The renderer merges each new options object with the current runtime override.
The dashboard owns its control state. RabbitHead does not render those controls.

Layout and style
----------------
RabbitHead renders a positioned root and the head stage. The root fills its
parent. Give the parent a width and height. The root also accepts style and
className. Parent CSS can override the component CSS.

The canvas and crosshairs are part of the renderer. Dashboard labels, model
buttons, sculpt controls, and snapshot controls are not rendered by RabbitHead.

Local package
-------------
The renderer and canvas are included in this folder. No source project is needed.
Use transparentBg for a clear canvas. For a page background, set interactive
and wheelZoom to false. The root fills 100% of its parent width and height.

Vertical position
-----------------
panY defaults to 0. Use a negative value to move up and a positive value to
move down. Set it directly or through settings.view.panY. A direct prop takes
priority. The runtime view command also accepts panY.
