LOCAL DATABASE TOOLS

rab-world/ contains local metadata scaffolds and refresh runners.
hybrid-seat-ranking/ contains the copied ranking tool adapters.
Read each folder README.txt for its setup and connection requirements.

tools/new-sqlite-db creates a new database folder and placeholder file.
tools/new-db-table creates one table with the standard House columns.
new-db-table imports database-tools.mjs from the copied new-sqlite-db folder.

db/setup.mjs calls the exported run(settings) entry points in these copies.
Each returns status, settings and response or error. Read the adjacent
settings and usage files before calling a tool directly. Node 24 is required.
The original HQ toolkit remains unchanged. No external toolkit lookup is
required by the dashboard installer.

The local toolkit folder is registered through rab.beacon.json. Its child
settings and skills keep their existing IDs. world.toolkits still supplies
the operational directories used by numeric tool lookup; the beacon records
the folder's source-discovery scope.

