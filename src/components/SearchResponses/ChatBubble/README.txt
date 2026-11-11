ChatBubble
==========

Use result_type search-response in SearchResponses, or render ChatBubble directly.
The default side is left. Left uses model_class. Right uses user_class.
Both class props default to container-alt. Empty classes remove the default skin.
Only the middle content row gets that skin and pad-lg.

Props extend HouseKeys. children is required. title and Footer accept ReactNode.
The left title uses title, with Model as the default. The right title always says User.
Both sides require date as a numeric millisecond timestamp.
The parent supplies the date. The component formats it next to the title.
Footer is below the content and has no container skin.
Left bubbles accept status sent or read. The default is sent.
The footer shows the status. Right user bubbles never show status.

The wrapper has .5em top and bottom padding.
The wrapper uses width: max-content, capped at 100 percent of its parent.
Only ChatBubble's middle container uses --radius-xl.
A left bubble has 10 percent right padding.
A right bubble has 10 percent left padding.
Titles and footers align to their side.
The left middle container has a square bottom-left corner.
The right middle container has a square bottom-right corner.

The wrapper composes chat-bubble, left or right, and className.
The inner uses a one-column grid with automatic rows.
The component owns no state and performs no I/O.
Use the class props, theme tokens, or parent CSS for style overrides.
