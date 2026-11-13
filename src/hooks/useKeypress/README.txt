useKeypress

Call useKeypress({ key: "Escape", callback }) at the top level of a React
component or hook. The callback receives the matching KeyboardEvent.
The hook listens on document while mounted and matches KeyboardEvent.key
exactly. The callback can check whether it should act on the event.
