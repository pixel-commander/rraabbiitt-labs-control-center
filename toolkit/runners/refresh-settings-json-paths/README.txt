refresh-settings-json-paths

Call run({ path }, options?) with a folder path.
Collects every rab.settings.json location recursively, then calls refresh-settings-json on each.
Uses shared RunnersProps, RunnerCallbacks, RunnerReturn and runTools for one tracking owner.
Returns the flat array of all tool results, including failures; remaining locations continue.
No matches returns []. Invalid folder input throws. Links and junctions are skipped.
The tool owns JSON writes, ID generation and relative file entries. No database refresh.
