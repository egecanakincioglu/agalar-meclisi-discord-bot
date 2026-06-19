import type { Client } from "discord.js";
import { getAllEnabledVoiceSettings } from "../database/repositories/VoiceSettingsRepository.js";
import { botJoinVoice } from "../features/VoiceFeature.js";

export async function autoJoinVoiceChannels(client: Client): Promise<void> {
  const settings = getAllEnabledVoiceSettings();

  if (settings.length === 0) {
    console.log("[Voice] Aktif ses ayarı bulunamadı.");
    return;
  }

  for (const setting of settings) {
    if (!setting.channelId) continue;

    const guild = client.guilds.cache.get(setting.guildId);
    if (!guild) { console.log(`[Voice] Sunucu bulunamadı: ${setting.guildId}`); continue; }

    try {
      botJoinVoice(client, guild, setting.channelId);
    } catch (error) {
      console.error(`[Voice] Bağlanma hatası: ${setting.guildId}`, error);
    }
  }
}
