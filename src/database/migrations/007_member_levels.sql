CREATE TABLE IF NOT EXISTS member_levels (
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  last_message_at TEXT,
  PRIMARY KEY (guild_id, user_id)
);

CREATE INDEX IF NOT EXISTS member_levels_guild_idx ON member_levels (guild_id);
CREATE INDEX IF NOT EXISTS member_levels_xp_idx ON member_levels (guild_id, xp DESC);
