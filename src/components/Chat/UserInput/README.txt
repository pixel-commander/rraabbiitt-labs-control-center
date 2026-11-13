UserInput
=========

Render UserInput with optional handleSubmit, handleChange, placeholder, disabled and className.

Implementation: UserInput.tsx
Exports: UserInput

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
import type { ChatInputHandler } from "../Chat.types";
export interface UserInputProps extends HouseKeys {
  handleSubmit?: ChatInputHandler;
  handleChange?: ChatInputHandler;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}


Usage skill
-----------
schema: 1
intent: use
id: 1793992921693
name: UserInput
path: src/components/Chat/UserInput
file: UserInput.tsx
owner:
  id: 1793992769266
  path: src/components/Chat/UserInput
  file: rab.settings.json
implementation:
  - path: src/components/Chat/UserInput
    file: UserInput.tsx
instructions: Render UserInput with optional handleSubmit, handleChange,
  placeholder, disabled and className. Returns an independent text input and
  Send button using side-right grid layout. Callbacks receive {message} and
  user-input action. Browser autocomplete is off. Does not import SearchBar,
  convert users, create message records or send network requests.
