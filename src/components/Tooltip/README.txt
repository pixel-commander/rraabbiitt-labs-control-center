Tooltip
=======

Tooltip imports the shared SmartTooltip. It does not copy placement or pointer logic.

Supply targetRef for the target element. Use content or children for the body.
Use title for an optional ReactNode heading.
placement accepts above, below, left, right, before, or after.
disabled removes the tooltip. positionRef supplies an optional live anchor.

container_class already exists in SmartTooltip. It is passed through unchanged.
The local default is container-neg. Supply another atom to change the skin.
An empty string removes the local default and uses the shared component's skin.
The local stylesheet lets that atom override the shared default skin layer.
className is added to tooltip and the shared smart-tooltip base class.
The wrapper forwards the complete incoming props bag.

The shared component owns positioning, pointer listeners, viewport flipping and portal cleanup.
It follows pointer movement. Keyboard-focus activation is not part of its current API.

Use shared --smart-tooltip-* tokens, container_class, className, or parent CSS for style overrides.
Theme variables must reach the portal host. The labs app sets its theme on the document root.

See the Tooltip section of the StyleGuide for default, container-alt and disabled examples.
