new-db-table

Call run(settings) through runner-use-tool. Preserve incoming settings. Returns ToolReturn with status complete/error, settings, response or error. Tracking belongs to the runner. Node 24+ is required. path is an existing database folder; file defaults to app.sqlite; name is the new SQL table. Creates the standard House columns in a transaction. Refuses existing schema objects. Does not add records or migrations. response.body is JSON containing verified column details.

Copied from C:/rab-worlds/src/toolkits/rab-react/generators/new-db-table.
Source implementations and source IDs are retained; local entry points and metadata use the World Demo tool contract.
Verification: node --experimental-strip-types --test toolkits/tools/database-tools.test.mjs
