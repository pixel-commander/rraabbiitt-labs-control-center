new-sqlite-db

Call run(settings) through runner-use-tool. Preserve incoming settings. Returns ToolReturn with status complete/error, settings, response or error. Tracking belongs to the runner. Node 24+ is required. path is an existing parent folder; name defaults to db and file to app.sqlite. Creates an empty SQLite placeholder, README, .gitignore and tables/.gitkeep. Refuses an existing folder. No tables, records or indexing.

Copied from C:/rab-worlds/src/toolkits/rab-react/generators/new-sqlite-db.
Source implementations and source IDs are retained; local entry points and metadata use the World Demo tool contract.
Verification: node --experimental-strip-types --test toolkits/rab-world/tools/database-tools.test.mjs
