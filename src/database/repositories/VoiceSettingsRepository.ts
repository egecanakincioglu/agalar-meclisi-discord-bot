import { eq } from "drizzle-orm";
import { db } from "../Client.js";
import { voiceSettings } from "../Schema.js";

export type VoiceSettings = {
  guildId: string;
  enabled: boolean;
  channelId: string | null;
};

export type VoiceSettingsPatch = {
  enabled?: boolean;
  channelId?: string | null;
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

function ensureVoiceSettings(guildId: string): void {
  db.insert(voiceSettings)
    .values({
      guildId,
      enabled: 0,
      channelId: null,
      createdAt: now(),
      updatedAt: now(),
    })
    .onConflictDoNothing()
    .run();
}

export function getVoiceSettings(guildId: string): VoiceSettings {
  ensureVoiceSettings(guildId);

  const row = db
    .select()
    .from(voiceSettings)
    .where(eq(voiceSettings.guildId, guildId))
    .get();

  if (!row) {
    return { guildId, enabled: false, channelId: null };
  }

  return {
    guildId: row.guildId,
    enabled: toBoolean(row.enabled),
    channelId: row.channelId,
  };
}

export function updateVoiceSettings(
  guildId: string,
  patch: VoiceSettingsPatch,
): VoiceSettings {
  ensureVoiceSettings(guildId);

  const updateData: Record<string, unknown> = { updatedAt: now() };

  if (patch.enabled !== undefined) {
    updateData.enabled = toInteger(patch.enabled);
  }

  if (patch.channelId !== undefined) {
    updateData.channelId = patch.channelId;
  }

  db.update(voiceSettings)
    .set(updateData)
    .where(eq(voiceSettings.guildId, guildId))
    .run();

  return getVoiceSettings(guildId);
}

export function getAllEnabledVoiceSettings(): VoiceSettings[] {
  const rows = db
    .select()
    .from(voiceSettings)
    .all();

  return rows
    .filter(row => toBoolean(row.enabled) && row.channelId !== null)
    .map(row => ({
      guildId: row.guildId,
      enabled: toBoolean(row.enabled),
      channelId: row.channelId,
    }));
}
