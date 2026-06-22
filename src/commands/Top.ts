import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import { getInviteLeaderboard } from "../database/repositories/InviteRepository.js";

const medals = ["🥇", "🥈", "🥉"];

const command: Command = {
  data: new SlashCommandBuilder().setName("top").setDescription("Sunucudaki davet sıralamasını gösterir."),

  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "Bu komut sadece sunucuda kullanılabilir.", flags: 64 });
      return;
    }

    const top = getInviteLeaderboard(interaction.guildId, 10);
    if (top.length === 0) {
      await interaction.reply({ content: "Henüz kayıtlı davet verisi yok.", flags: 64 });
      return;
    }

    const lines = top.map((row, i) => {
      const rank = medals[i] ?? `**${i + 1}.**`;
      return `${rank} <@${row.userId}> — **${row.netInvites}** net davet`;
    });

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle("🏆 Davet Sıralaması")
      .setDescription(lines.join("\n"))
      .setFooter({ text: `${interaction.guild?.name ?? "Sunucu"} • /invites ile detayları gör` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
