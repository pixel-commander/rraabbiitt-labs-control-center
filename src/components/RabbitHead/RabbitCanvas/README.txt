RabbitCanvas
============

Small structural subcomponent that provides the canvas element used by RabbitStage.
RabbitStage owns the drawing loop, renderer state, pointer interaction, and cleanup.
RabbitHead is the portable component for external renderer settings. RabbitCanvas
does not accept effect settings.

Props
-----
- canvasRef (required): React ref attached to the canvas so RabbitStage can draw into it.
- className (optional): Additional class appended to the rabbit-canvas base class.

Styling
-------
The base class positions the canvas across its containing stage. Override it with
className or parent/external CSS. The parent supplies the stage dimensions.
