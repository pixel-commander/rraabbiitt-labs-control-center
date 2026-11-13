MessageBubble
=============

Render MessageBubble with name, message and side (left or right).

Implementation: MessageBubble.tsx
Exports: MessageBubble

Render this component with the props below. Application data and persistence remain with the caller.

Customization
-------------
UI classes can be overridden via theme tokens, component tokens, supplied className/container_class/cell_class/event_class props where exposed, or CSS in a parent/external stylesheet. Use only the class props declared by this implementation. The component base class stays in place. An omitted container_class uses the implementation default; an empty string deliberately removes that default. Parent CSS can target the component base class and its documented child classes. Put stylesheet overrides after defaults or in the overrides layer. Tokens must be applied to the component element when it defines its own defaults. Plain functions do not render containers; style the elements supplied to them.

Sizing
------
The caller supplies available layout space. Scroll regions require a bounded grid track and min-block-size: 0. Preview-only dimensions belong in demo files, not reusable component defaults.

Public types
------------
import type { HouseKeys } from "../../../HouseKeys.types";
import type { ReactNode } from "react";
import type { HandlerKey } from "../../../HouseKeys.types";
export interface MessageBubbleProps extends HouseKeys {
  side?: "left" | "right";
  name: string;
  message: ReactNode;
  status?: "sent" | "read";
  date?: number;
  handleClick?: HandlerKey<
    { name: string; message: ReactNode; side: "left" | "right" },
    "message-click",
    void
  >;
  className?: string;
  container_class?: string;
}


Usage skill
-----------
schema: 1
intent: use
id: 1793992921668
name: MessageBubble
path: src/components/Chat/MessageBubble
file: MessageBubble.tsx
owner:
  id: 1793992769254
  path: src/components/Chat/MessageBubble
  file: rab.settings.json
implementation:
  - path: src/components/Chat/MessageBubble
    file: MessageBubble.tsx
instructions: Render MessageBubble with name, message and side (left or right).
  Optional status/date render as supplied. handleClick receives name, message
  and side with message-click action. Returns an aligned bubble inside a grid
  wrapper. Left has 2em right padding; right has 2em left padding. No fixed or
  maximum width. Feedback controls are not implemented.
