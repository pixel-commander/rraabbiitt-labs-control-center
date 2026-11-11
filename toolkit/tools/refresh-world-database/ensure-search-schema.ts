import type { DatabaseSync } from "node:sqlite";

/** Add search support to the existing application database without replacing its tables. */
export function ensureSearchSchema(db: DatabaseSync): void {
  if (!db.prepare("PRAGMA table_info(records)").all().some(column => column.name === "data"))
    db.exec("ALTER TABLE records ADD COLUMN data TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(data) AND json_type(data)='object')");
  db.exec(`
    CREATE TABLE IF NOT EXISTS words (id INTEGER PRIMARY KEY, word TEXT NOT NULL UNIQUE);
    CREATE TABLE IF NOT EXISTS record_words (
      record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
      field TEXT NOT NULL, position INTEGER NOT NULL, word_id INTEGER NOT NULL REFERENCES words(id),
      PRIMARY KEY(record_id,field,position));
    CREATE TABLE IF NOT EXISTS record_pairs (
      record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
      field TEXT NOT NULL, position INTEGER NOT NULL,
      first_word_id INTEGER NOT NULL REFERENCES words(id), second_word_id INTEGER NOT NULL REFERENCES words(id),
      PRIMARY KEY(record_id,field,position));
    CREATE INDEX IF NOT EXISTS record_words_lookup ON record_words(word_id,record_id);
    CREATE INDEX IF NOT EXISTS record_pairs_lookup ON record_pairs(first_word_id,second_word_id,record_id);
    CREATE VIRTUAL TABLE IF NOT EXISTS catalog_fts USING fts5(
      collection UNINDEXED, id UNINDEXED, name,path,title,tags,description,body, tokenize='unicode61');
  `);
  for (const table of ["records", "messages", "docs", "runs", "tool_calls", "tool_usage"]) {
    if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table)) continue;
    const usage = table === "tool_usage";
    const columns = (prefix: string) => {
      const p = prefix ? `${prefix}.` : "";
      if (usage) return `${p}rowid, 'tool usage', '', '', '', '', CAST(${p}id AS TEXT)||' '||CAST(${p}date AS TEXT)||' '||COALESCE(CAST(${p}message AS TEXT),'')`;
      const body = table === "records"
        ? `COALESCE(json_extract(${p}data,'$.text'),'')||char(10)||COALESCE(json_extract(${p}data,'$.instructions'),'')`
        : `COALESCE(${p}description,'')`;
      return `${p}id, ${p}name, ${p}path, ${p}title, ${p}tags, ${p}description, ${body}`;
    };
    const key = usage ? "rowid" : "id";
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS catalog_fts_${table}_insert AFTER INSERT ON ${table} BEGIN
        INSERT INTO catalog_fts VALUES('${table}', ${columns("new")}); END;
      CREATE TRIGGER IF NOT EXISTS catalog_fts_${table}_update AFTER UPDATE ON ${table} BEGIN
        DELETE FROM catalog_fts WHERE collection='${table}' AND id=old.${key};
        INSERT INTO catalog_fts VALUES('${table}', ${columns("new")}); END;
      CREATE TRIGGER IF NOT EXISTS catalog_fts_${table}_delete AFTER DELETE ON ${table} BEGIN
        DELETE FROM catalog_fts WHERE collection='${table}' AND id=old.${key}; END;
      DELETE FROM catalog_fts WHERE collection='${table}';
      INSERT INTO catalog_fts SELECT '${table}', ${columns("")} FROM ${table};
    `);
  }
}
