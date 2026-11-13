list-css-atoms

Lists actual CSS atom records without modifying them. No settings are required.
Optional House settings: path (atoms directory), query (all words must match),
type (container, action, effect, grid).

Returns the standard House ToolReturn: return_type results, status, settings,
response.paths and response.summary count/total. Each choice includes House
identity, title, description, tags, path/file, type, and class_name.
Empty matches are successful with count 0. Invalid input or broken metadata
returns status error and error text. The run wrapper reports tool usage.

Examples: {} or {"type":"container"} or {"query":"border"}.
Class names populate container_class/action_class/effect_class in Factory.
This lists registered atom records, not arbitrary selectors in stylesheets.
