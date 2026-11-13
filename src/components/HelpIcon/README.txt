HelpIcon
========

Small, borderless question-mark trigger with an integrated SmartTooltip. The
tooltip follows the pointer, flips when it would clip the viewport, and is
rendered in a portal so parent overflow does not clip it.

Usage
-----

import { HelpIcon } from "@shared/components/HelpIcon/HelpIcon";

<label>
  Temperature <HelpIcon content="Controls how varied the response is." />
</label>

Props
-----

- content?: ReactNode — tooltip body. Plain strings are included in the
  trigger's accessible name. Without content or title, the trigger remains a
  labeled question mark and no tooltip is mounted.
- title?: string — optional tooltip heading (inherited from HouseKeys).
- label?: string — accessible trigger name; defaults to "Help".
- placement?: SmartTooltipPlacement — preferred tooltip side; defaults to above.
- className?: string — class appended to the trigger's help-icon class.

Styling
-------

The icon uses --content-muted, --accent-secondary, and --border-focus theme
tokens. Override those tokens on a parent, pass className to the trigger, or
target .help-icon from parent/external CSS. The trigger has no resting border.
Tooltip visuals and tokens are owned by SmartTooltip.
