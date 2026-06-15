CREATE TABLE IF NOT EXISTS guild_settings (
  guild_id TEXT PRIMARY KEY,

  welcome_enabled INTEGER NOT NULL DEFAULT 1,
  welcome_channel_id TEXT,

  leave_enabled INTEGER NOT NULL DEFAULT 1,
  leave_channel_id TEXT,

  auto_role_enabled INTEGER NOT NULL DEFAULT 1,
  auto_role_id TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);