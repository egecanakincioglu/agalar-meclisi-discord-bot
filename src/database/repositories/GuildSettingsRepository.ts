import { eq } from "drizzle-orm";
import { db } from "../Client.js";
import { guildSettings } from "../Schema.js";

export type GuildSettings = {
  guildId: string;
  welcomeEnabled: boolean;
  welcomeChannelId: string | null;
  leaveEnabled: boolean;
  leaveChannelId: string | null;
  autoRoleEnabled: boolean;
  autoRoleId: string | null;
};

export type GuildSettingsPatch = {
  welcomeEnabled?: boolean;
  welcomeChannelId?: string | null;
  leaveEnabled?: boolean;
  leaveChannelId?: string | null;
  autoRoleEnabled?: boolean;
  autoRoleId?: string | null;
};

function now(): string {
  return new Date().toISOString();
}

function toBoolean(value: number): boolean {
  return value === 1;
}

function toInteger(value: boolean): number {
  return value ? 1 : 0;
}

function ensureGuildSettings(guildId: string): void {
  db.insert(guildSettings)
    .values({
      guildId,
      welcomeEnabled: 1,
      welcomeChannelId: null,
      leaveEnabled: 1,
      leaveChannelId: null,
      autoRoleEnabled: 1,
      autoRoleId: null,
      createdAt: now(),
      updatedAt: now(),
    })
    .onConflictDoNothing()
    .run();
}

export function getGuildSettings(guildId: string): GuildSettings {
  ensureGuildSettings(guildId);

  const row = db
    .select()
    .from(guildSettings)
    .where(eq(guildSettings.guildId, guildId))
    .get();

  if (!row) {
    return {
      guildId,
      welcomeEnabled: true,
      welcomeChannelId: null,
      leaveEnabled: true,
      leaveChannelId: null,
      autoRoleEnabled: true,
      autoRoleId: null,
    };
  }

  return {
    guildId: row.guildId,
    welcomeEnabled: toBoolean(row.welcomeEnabled),
    welcomeChannelId: row.welcomeChannelId,
    leaveEnabled: toBoolean(row.leaveEnabled),
    leaveChannelId: row.leaveChannelId,
    autoRoleEnabled: toBoolean(row.autoRoleEnabled),
    autoRoleId: row.autoRoleId,
  };
}

export function updateGuildSettings(
  guildId: string,
  patch: GuildSettingsPatch,
): GuildSettings {
  ensureGuildSettings(guildId);

  const data: Record<string, unknown> = { updatedAt: now() };

  if (patch.welcomeEnabled !== undefined) data.welcomeEnabled = toInteger(patch.welcomeEnabled);
  if (patch.welcomeChannelId !== undefined) data.welcomeChannelId = patch.welcomeChannelId;
  if (patch.leaveEnabled !== undefined) data.leaveEnabled = toInteger(patch.leaveEnabled);
  if (patch.leaveChannelId !== undefined) data.leaveChannelId = patch.leaveChannelId;
  if (patch.autoRoleEnabled !== undefined) data.autoRoleEnabled = toInteger(patch.autoRoleEnabled);
  if (patch.autoRoleId !== undefined) data.autoRoleId = patch.autoRoleId;

  db.update(guildSettings)
    .set(data)
    .where(eq(guildSettings.guildId, guildId))
    .run();

  return getGuildSettings(guildId);
}

export function resetGuildSettings(guildId: string): GuildSettings {
  return updateGuildSettings(guildId, {
    welcomeEnabled: true,
    welcomeChannelId: null,
    leaveEnabled: true,
    leaveChannelId: null,
    autoRoleEnabled: true,
    autoRoleId: null,
  });
}
