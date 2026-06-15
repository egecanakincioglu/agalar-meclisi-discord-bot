CREATE TABLE IF NOT EXISTS voice_settings (
  guild_id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 0,
  channel_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
