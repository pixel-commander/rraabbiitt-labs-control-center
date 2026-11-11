DATABASE

The application uses one database: db/main/app.sqlite. The root rab.project.json
registers its location. records holds source settings and skills, keyed by their
existing numeric House IDs. Raw indexed metadata remains in records.data.
Messages, docs, runs, tool_calls and tool_usage remain in this same database.

SQLite FTS5 catalog_fts covers all these tables. Insert/update/delete triggers
keep it synchronized. record_words/record_pairs provide indexed term lookup.
Search schema is owned by the refresh-world-database tool's ensure-search-schema.ts.

Run npm run db:setup to prepare a new database without replacing existing data.
The refresh-world-database tool reconciles source-managed records; removed sources
lose their records and search entries. Other application data is preserved.
Live SQLite files are runtime data and are Git-ignored.
