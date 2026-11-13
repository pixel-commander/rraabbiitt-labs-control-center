Messages
========

Render Messages with messages: ChatMessage[].

Implementation: Messages.tsx
Exports: Messages

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
import type { ChatMessage, ChatMessageHandler } from "../Chat.types";
export interface MessagesProps extends HouseKeys {
  messages: ChatMessage[];
  handleClick?: ChatMessageHandler;
  className?: string;
}


Usage skill
-----------
schema: 1
intent: use
id: 1793992921679
name: Messages
path: src/components/Chat/Messages
file: Messages.tsx
owner:
  id: 1793992769280
  path: src/components/Chat/Messages
  file: rab.settings.json
implementation:
  - path: src/components/Chat/Messages
    file: Messages.tsx
instructions: "Render Messages with messages: ChatMessage[]. Each record
  contains id, user (text), message, optional name, status (sent/read) and date.
  Returns a MessageBubble for each record in array order. user equal to user is
  left; other users are right. handleClick receives the original record. No data
  conversion or storage."
