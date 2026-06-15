CREATE TABLE IF NOT EXISTS invite_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,

  total_invites INTEGER NOT NULL DEFAULT 0,
  active_invites INTEGER NOT NULL DEFAULT 0,
  left_invites INTEGER NOT NULL DEFAULT 0,

  bonus_invites INTEGER NOT NULL DEFAULT 0,
  fake_invites INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  UNIQUE (guild_id, user_id)
);

CREATE INDEX IF NOT EXISTS invite_stats_guild_idx
  ON invite_stats (guild_id);