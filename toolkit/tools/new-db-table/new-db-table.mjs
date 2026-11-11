import path from "node:path";
import { stat } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { filename, directory } from "../new-sqlite-db/database-tools.mjs";

const columns = [
  ["id", "INTEGER PRIMARY KEY NOT NULL"],
  ["name", "TEXT"],
  ["title", "TEXT"],
  ["type", "TEXT"],
  ["description", "TEXT"],
  [
    "tags",
    "TEXT DEFAULT '[]' CHECK (tags IS NULL OR (json_valid(tags) AND json_type(tags) = 'array'))",
  ],
  ["file", "TEXT"],
  ["path", "TEXT"],
  [
    "paths",
    "TEXT DEFAULT '[]' CHECK (paths IS NULL OR (json_valid(paths) AND json_type(paths) = 'array'))",
  ],
];

async function create(input = {}) {
  const folder = directory(input.path),
    file = filename(input.file);
  const name = input.name;
  if (
    typeof name !== "string" ||
    !/^[a-z][a-z0-9_]*$/.test(name) ||
    name.startsWith("sqlite_")
  )
    throw Error(
      "name must be a lowercase SQL identifier, excluding sqlite_ names",
    );
  const target = path.join(folder, file);
  if (!(await stat(target)).isFile())
    throw Error("Database must be an existing file");
  const db = new DatabaseSync(target);
  let transaction = false;
  try {
    db.exec("PRAGMA busy_timeout=5000; BEGIN IMMEDIATE");
    transaction = true;
    if (
      db
        .prepare("SELECT 1 FROM sqlite_master WHERE name = ? COLLATE NOCASE")
        .get(name)
    )
      throw Error("Table or schema object already exists: " + name);
    // WITHOUT ROWID requires callers to supply house IDs rather than SQLite assigning them.
    db.exec(
      'CREATE TABLE "' +
        name +
        '" (' +
        columns.map(([key, type]) => '"' + key + '" ' + type).join(", ") +
        ") WITHOUT ROWID",
    );
    const actual = db.prepare('PRAGMA table_info("' + name + '")').all();
    if (
      actual.length !== columns.length ||
      actual.some((column, i) => column.name !== columns[i][0])
    )
      throw Error("Table verification failed");
    db.exec("COMMIT");
    transaction = false;
    return {
      path: folder,
      file,
      name,
      columns: actual.map(({ name, type, pk }) => ({
        name,
        type,
        primary_key: !!pk,
      })),
      rows: 0,
    };
  } finally {
    try {
      if (transaction) db.exec("ROLLBACK");
    } finally {
      db.close();
    }
  }
}

export async function executeTool(settings = {}) {
  try {
    const result = await create(settings);
    const paths = result.files
      ? result.files.map((file) => ({ path: result.path, file, type: "file" }))
      : [
          {
            path: result.path,
            file: result.file,
            name: result.name,
            type: "table",
          },
        ];
    return { return_type: "scaffold",
      status: "complete",
      settings,
      response: {
        path: result.path,
        file: result.file,
        paths,
        body: JSON.stringify(result),
        summary: { count: paths.length },
      },
    };
  } catch (error) {
    return { return_type: "scaffold",
      status: "error",
      settings,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export const run = async (settings = {}) => {
  let result;
  try {
    result = { ...await executeTool(settings), return_type: "scaffold" };
  } catch (error) {
    result = { return_type: "scaffold", status: "error", settings, error: error instanceof Error ? error.message : String(error) };
  }
  try {
    const { finishToolUsage } = await import("../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1791766641356, settings, result);
  } catch (error) {
    return { ...result, error: [result.error, `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`].filter(Boolean).join("\n") };
  }
};
