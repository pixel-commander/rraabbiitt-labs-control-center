generate-world-database

Call run(settings) through runner-use-tool. Preserve incoming settings. Returns ToolReturn with status complete/error, settings, response or error. Tracking belongs to the runner. Node 24+ is required. path must be an absolute destination directory. file defaults to catalog.sqlite. Copies the verified local catalog template and refuses an existing file. Does not populate the catalog or register the output.

Copied from C:/rab-worlds/src/toolkits/rab-world-v2/generators/generate-world-database.
Source implementations and source IDs are retained; local entry points and metadata use the World Demo tool contract.
Verification: node --experimental-strip-types --test toolkits/tools/database-tools.test.mjs
