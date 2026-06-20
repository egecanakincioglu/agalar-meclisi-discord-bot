import { EmbedBuilder, SlashCommandBuilder, version as discordJsVersion } from "discord.js";
import type { Command } from "../types/Command.js";
import { getConfig } from "../handlers/ConfigHandler.js";

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400); const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60); const s = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}g`); if (h > 0) parts.push(`${h}s`); if (m > 0) parts.push(`${m}dk`); parts.push(`${s}sn`);
  return parts.join(" ");
}

function formatBytes(bytes: number): string { const mb = bytes / 1024 / 1024; return `${mb.toFixed(1)} MB`; }
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

const command: Command = {
  data: new SlashCommandBuilder().setName("status").setDescription("Botun anlık durumu ve detaylı bilgilerini gösterir."),
  async execute(interaction) {
    const config = getConfig(); const client = interaction.client;
    const wsPing = client.ws.ping; const uptime = process.uptime();
    const memory = process.memoryUsage(); const heapUsed = memory.heapUsed; const rss = memory.rss;
    const guildCount = client.guilds.cache.size;
    const totalMembers = client.guilds.cache.reduce((sum, g) => sum + g.memberCount, 0);
    const totalChannels = client.guilds.cache.reduce((sum, g) => sum + g.channels.cache.size, 0);
    const developerIds = config.bot.developer.developerIds; const firstDevId = developerIds[0];
    const devMention = firstDevId ? `<@${firstDevId}>` : "Yok"; const devLabel = firstDevId ? "Arimo" : "Yok";
    const botUser = client.user; const botName = botUser?.username ?? "Bilinmiyor";
    const botId = botUser?.id ?? "Bilinmiyor"; const botCreatedAt = botUser?.createdTimestamp ?? 0;
    const botAvatar = botUser?.displayAvatarURL({ size: 256 }) ?? null;
    const messageLatency = Date.now() - interaction.createdTimestamp;

    const embed = new EmbedBuilder().setColor(0x2b2d31)
      .setAuthor({ name: `${botName} • Durum Raporu`, iconURL: botAvatar ?? undefined }).setThumbnail(botAvatar)
      .addFields(
        { name: "🤖 Bot", value: `**İsim:** ${botName}\n**ID:** ${botId}\n**Kuruluş:** ${formatDate(botCreatedAt)}\n**Uptime:** ${formatUptime(uptime)}\n**Geliştirici:** ${devMention} (${devLabel})`, inline: false },
        { name: "⚡ Performans", value: `**WebSocket Ping:** ${wsPing}ms\n**Mesaj Gecikmesi:** ${messageLatency}ms\n**RAM (Heap):** ${formatBytes(heapUsed)}\n**RAM (RSS):** ${formatBytes(rss)}`, inline: true },
        { name: "📦 Versiyonlar", value: `**Node.js:** ${process.version}\n**discord.js:** v${discordJsVersion}\n**Bot:** 1.0.0`, inline: true },
        { name: "🌐 Sunucular", value: `**Sunucu:** ${guildCount}\n**Üye:** ${totalMembers.toLocaleString()}\n**Kanal:** ${totalChannels.toLocaleString()}`, inline: true },
        { name: "⚙️ Config", value: `**Presence:** ${config.presence.enabled ? "Aktif" : "Kapalı"}\n**Status:** ${config.presence.status}\n**Aktivite:** ${config.presence.activityType}\n**Auto Deploy:** ${config.bot.commands.autoDeploy ? "Açık" : "Kapalı"}\n**Dil:** ${config.bot.info.language}\n**Zaman Dilimi:** ${config.bot.info.timezone}`, inline: true },
      )
      .setFooter({ text: `${interaction.user.tag} tarafından istendi`, iconURL: interaction.user.displayAvatarURL() }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
export default command;
