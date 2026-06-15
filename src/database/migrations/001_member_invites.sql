CREATE TABLE IF NOT EXISTS member_invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  guild_id TEXT NOT NULL,
  member_id TEXT NOT NULL,

  inviter_id TEXT,
  invite_code TEXT,

  joined_at TEXT NOT NULL,
  left_at TEXT,

  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS member_invites_guild_member_idx
  ON member_invites (guild_id, member_id);

CREATE INDEX IF NOT EXISTS member_invites_inviter_idx
  ON member_invites (guild_id, inviter_id);

CREATE INDEX IF NOT EXISTS member_invites_active_idx
  ON member_invites (guild_id, is_active);