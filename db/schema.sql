CREATE TABLE IF NOT EXISTS "docs" ("id" INTEGER PRIMARY KEY NOT NULL, "name" TEXT, "title" TEXT, "type" TEXT, "description" TEXT, "tags" TEXT DEFAULT '[]' CHECK (tags IS NULL OR (json_valid(tags) AND json_type(tags) = 'array')), "file" TEXT, "path" TEXT, "paths" TEXT DEFAULT '[]' CHECK (paths IS NULL OR (json_valid(paths) AND json_type(paths) = 'array'))) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS "messages" ("id" INTEGER PRIMARY KEY NOT NULL, "name" TEXT, "title" TEXT, "type" TEXT, "description" TEXT, "tags" TEXT DEFAULT '[]' CHECK (tags IS NULL OR (json_valid(tags) AND json_type(tags) = 'array')), "file" TEXT, "path" TEXT, "paths" TEXT DEFAULT '[]' CHECK (paths IS NULL OR (json_valid(paths) AND json_type(paths) = 'array'))) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS "records" ("id" INTEGER PRIMARY KEY NOT NULL, "name" TEXT, "title" TEXT, "type" TEXT, "description" TEXT, "tags" TEXT DEFAULT '[]' CHECK (tags IS NULL OR (json_valid(tags) AND json_type(tags) = 'array')), "file" TEXT, "path" TEXT, "paths" TEXT DEFAULT '[]' CHECK (paths IS NULL OR (json_valid(paths) AND json_type(paths) = 'array')), "data" TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(data) AND json_type(data)='object')) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS "runs" ("id" INTEGER PRIMARY KEY NOT NULL, "name" TEXT, "title" TEXT, "type" TEXT, "description" TEXT, "tags" TEXT DEFAULT '[]' CHECK (tags IS NULL OR (json_valid(tags) AND json_type(tags) = 'array')), "file" TEXT, "path" TEXT, "paths" TEXT DEFAULT '[]' CHECK (paths IS NULL OR (json_valid(paths) AND json_type(paths) = 'array'))) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS "tool_calls" ("id" INTEGER PRIMARY KEY NOT NULL, "name" TEXT, "title" TEXT, "type" TEXT, "description" TEXT, "tags" TEXT DEFAULT '[]' CHECK (tags IS NULL OR (json_valid(tags) AND json_type(tags) = 'array')), "file" TEXT, "path" TEXT, "paths" TEXT DEFAULT '[]' CHECK (paths IS NULL OR (json_valid(paths) AND json_type(paths) = 'array'))) WITHOUT ROWID;

-- Indexed lookup tables, FTS5 and synchronization triggers are owned by
-- toolkit/tools/refresh-world-database/ensure-search-schema.ts.

CREATE TABLE IF NOT EXISTS "favorites" ("id" INTEGER PRIMARY KEY NOT NULL, "name" TEXT, "title" TEXT, "type" TEXT, "description" TEXT, "tags" TEXT DEFAULT '[]' CHECK (tags IS NULL OR (json_valid(tags) AND json_type(tags) = 'array')), "file" TEXT, "path" TEXT, "paths" TEXT DEFAULT '[]' CHECK (paths IS NULL OR (json_valid(paths) AND json_type(paths) = 'array'))) WITHOUT ROWID;
