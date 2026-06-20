CREATE TABLE IF NOT EXISTS level_settings (
  guild_id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
