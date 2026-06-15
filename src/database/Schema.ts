import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const memberInvites = sqliteTable(
  "member_invites",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    guildId: text("guild_id").notNull(),
    memberId: text("member_id").notNull(),

    inviterId: text("inviter_id"),
    inviteCode: text("invite_code"),

    joinedAt: text("joined_at").notNull(),
    leftAt: text("left_at"),

    isActive: integer("is_active").notNull().default(1),
  },
  table => [
    index("member_invites_guild_member_idx").on(
      table.guildId,
      table.memberId,
    ),
    index("member_invites_inviter_idx").on(
      table.guildId,
      table.inviterId,
    ),
    index("member_invites_active_idx").on(
      table.guildId,
      table.isActive,
    ),
  ],
);

export const inviteStats = sqliteTable(
  "invite_stats",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    guildId: text("guild_id").notNull(),
    userId: text("user_id").notNull(),

    totalInvites: integer("total_invites").notNull().default(0),
    activeInvites: integer("active_invites").notNull().default(0),
    leftInvites: integer("left_invites").notNull().default(0),

    bonusInvites: integer("bonus_invites").notNull().default(0),
    fakeInvites: integer("fake_invites").notNull().default(0),

    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  table => [
    uniqueIndex("invite_stats_guild_user_unique").on(
      table.guildId,
      table.userId,
    ),
    index("invite_stats_guild_idx").on(table.guildId),
  ],
);

export const moderationLogs = sqliteTable(
  "moderation_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    guildId: text("guild_id").notNull(),
    moderatorId: text("moderator_id").notNull(),
    targetId: text("target_id").notNull(),

    action: text("action").notNull(),
    reason: text("reason"),

    createdAt: text("created_at").notNull(),
  },
  table => [
    index("moderation_logs_guild_idx").on(table.guildId),
    index("moderation_logs_target_idx").on(
      table.guildId,
      table.targetId,
    ),
  ],
);

export const voiceSettings = sqliteTable(
  "voice_settings",
  {
    guildId: text("guild_id").primaryKey(),

    enabled: integer("enabled").notNull().default(0),
    channelId: text("channel_id"),

    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
);

export const levelSettings = sqliteTable(
  "level_settings",
  {
    guildId: text("guild_id").primaryKey(),

    enabled: integer("enabled").notNull().default(0),

    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
);

export const memberLevels = sqliteTable(
  "member_levels",
  {
    guildId: text("guild_id").notNull(),
    userId: text("user_id").notNull(),

    xp: integer("xp").notNull().default(0),
    level: integer("level").notNull().default(1),

    lastMessageAt: text("last_message_at"),
  },
  table => [
    primaryKey({ columns: [table.guildId, table.userId] }),
    index("member_levels_guild_idx").on(table.guildId),
    index("member_levels_xp_idx").on(table.guildId, table.xp),
  ],
);

export const guildSettings = sqliteTable(
  "guild_settings",
  {
    guildId: text("guild_id").primaryKey(),

    welcomeEnabled: integer("welcome_enabled").notNull().default(1),
    welcomeChannelId: text("welcome_channel_id"),

    leaveEnabled: integer("leave_enabled").notNull().default(1),
    leaveChannelId: text("leave_channel_id"),

    autoRoleEnabled: integer("auto_role_enabled").notNull().default(1),
    autoRoleId: text("auto_role_id"),

    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
);
