import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import { getLevelLeaderboard, getLevelSettings } from "../database/repositories/LevelRepository.js";

const command: Command = {
  data: new SlashCommandBuilder().setName("lb").setDescription("Seviye sıralamasını gösterir."),

  async execute(interaction) {
    if (!interaction.guildId) { await interaction.reply({ content: "Bu komut sadece sunucuda kullanılabilir.", flags: 64 }); return; }
    const settings = getLevelSettings(interaction.guildId);
    if (!settings.enabled) { await interaction.reply({ content: "Seviye sistemi bu sunucuda aktif değil.", flags: 64 }); return; }

    const top = getLevelLeaderboard(interaction.guildId, 10);
    if (top.length === 0) { await interaction.reply("Henüz seviye verisi yok."); return; }

    const medals = ["🥇", "🥈", "🥉"];
    const lines = top.map((row, i) => {
      const rank = medals[i] ?? `**${i + 1}.**`;
      return `${rank} <@${row.userId}> — Seviye **${row.level}** (${row.xp} XP)`;
    });

    const embed = new EmbedBuilder().setColor(0xfee75c).setTitle("🏆 Seviye Sıralaması").setDescription(lines.join("\n")).setFooter({ text: `Toplam ${top.length} kişi` });
    await interaction.reply({ embeds: [embed] });
  },
};
export default command;
