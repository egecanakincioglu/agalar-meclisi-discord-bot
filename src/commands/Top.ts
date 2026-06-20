import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import { getInviteLeaderboard } from "../database/repositories/InviteRepository.js";

const command: Command = {
  data: new SlashCommandBuilder().setName("top").setDescription("Sunucudaki davet sıralamasını gösterir."),

  async execute(interaction) {
    if (!interaction.guildId) { await interaction.reply({ content: "Bu komut sadece sunucuda kullanılabilir.", flags: 64 }); return; }
    const top = getInviteLeaderboard(interaction.guildId, 10);
    if (top.length === 0) { await interaction.reply("Henüz kayıtlı davet verisi yok."); return; }

    const text = top.map((row, index) =>
      `**${index + 1}.** <@${row.userId}> — **${row.netInvites}** net (${row.activeInvites} aktif, ${row.leftInvites} ayrılan, ${row.bonusInvites} bonus, ${row.fakeInvites} fake)`,
    ).join("\n");

    await interaction.reply({ content: `🏆 **Davet Sıralaması**\n\n${text}` });
  },
};

export default command;
