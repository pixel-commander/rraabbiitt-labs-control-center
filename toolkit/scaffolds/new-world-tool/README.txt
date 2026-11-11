NEW WORLD TOOL

Call run({path, name, title?, description?, file?, tags?, settings?}).
path is an existing destination parent folder. name is lowercase/hyphenated.
file defaults to name.ts; name.js and name.mjs are also supported.
An existing destination folder is refused. Generates exactly two files:
the implementation and rab.settings.json. No overwrite or index rebuild.

The settings owner generates one numeric ID. That same ID is hard-coded in
the implementation's usage call and saved in its settings record.
The implementation imports ToolsProps and ToolReturn from the local House
contract. Its initial return_type is results; set it to match the tool when
adding its work. Payload shapes and House types are not defined by this stamp.

Every generated tool reports {id,date,message?} after its work, before return.
date is numeric epoch milliseconds. message is an optional numeric DB message ID.
Reporting is silent, bounded, and best effort. A missing helper, unavailable API,
or failed DB write appends an error without changing the tool status or payload.
The scaffold itself reports its own ID once per call, including failed calls.
The API folder is resolved from the project root rab.world.json registration.
MCP is not required for direct tool execution.
