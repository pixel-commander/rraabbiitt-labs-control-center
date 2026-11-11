CREATE TABLE IF NOT EXISTS tool_usage (
  id INTEGER NOT NULL,
  date INTEGER NOT NULL,
  message INTEGER
);
CREATE INDEX IF NOT EXISTS tool_usage_id_date ON tool_usage (id, date);
