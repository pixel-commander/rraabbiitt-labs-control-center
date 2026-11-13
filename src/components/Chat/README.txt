Chat
====

Render Chat with messages and optional handleSubmit, handleChange and handleClick.

Implementation: Chat.tsx
Exports: Chat

Render this component with the props below. Application data and persistence remain with the caller.

Customization
-------------
UI classes can be overridden via theme tokens, component tokens, supplied className/container_class/cell_class/event_class props where exposed, or CSS in a parent/external stylesheet. Use only the class props declared by this implementation. The component base class stays in place. An omitted container_class uses the implementation default; an empty string deliberately removes that default. Parent CSS can target the component base class and its documented child classes. Put stylesheet overrides after defaults or in the overrides layer. Tokens must be applied to the component element when it defines its own defaults. Plain functions do not render containers; style the elements supplied to them.

Sizing
------
The caller supplies available layout space. Scroll regions require a bounded grid track and min-block-size: 0. Preview-only dimensions belong in demo files, not reusable component defaults.

Public types
------------
import type { ReactNode } from "react";
import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";

export interface ChatMessage extends HouseKeys {
  id: number;
  user: string;
  name?: string;
  message: ReactNode;
  status: "sent" | "read";
  date: number;
}
export type ChatInputHandler = HandlerKey<
  { message: string },
  "user-input",
  void
>;
export type ChatMessageHandler = HandlerKey<ChatMessage, "message-click", void>;
export interface ChatProps extends HouseKeys {
  messages?: ChatMessage[];
  handleSubmit?: ChatInputHandler;
  handleChange?: ChatInputHandler;
  handleClick?: ChatMessageHandler;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}


Usage skill
-----------
schema: 1
intent: use
id: 1793992921651
name: Chat
path: src/components/Chat
file: Chat.tsx
owner:
  id: 1793976288032
  path: src/components/Chat
  file: rab.settings.json
implementation:
  - path: src/components/Chat
    file: Chat.tsx
instructions: Render Chat with messages and optional handleSubmit, handleChange
  and handleClick. Returns a main-footer layout with a bottom-aligned scrollable
  message list and UserInput footer. Messages remain in supplied order. Input
  callbacks receive {message} with user-input action; message clicks pass the
  original record. No message creation, user conversion, network sending or
  persistence. user equal to user is right; other users are left.
