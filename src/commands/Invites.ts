import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import { getInviteSummary } from "../database/repositories/InviteRepository.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("invites")
    .setDescription("Bir kullanıcının davet bilgilerini gösterir.")
    .addUserOption(option => option.setName("user").setDescription("Davet bilgisine bakılacak kullanıcı.").setRequired(false)),

  async execute(interaction) {
    if (!interaction.guildId) { await interaction.reply({ content: "Bu komut sadece sunucuda kullanılabilir.", flags: 64 }); return; }
    const user = interaction.options.getUser("user") ?? interaction.user;
    const summary = getInviteSummary(interaction.guildId, user.id);
    await interaction.reply({
      content: `${user} davet bilgileri:\n\nNet davet: **${summary.netInvites}**\nAktif davet: **${summary.activeInvites}**\nToplam davet: **${summary.totalInvites}**\nAyrılan davet: **${summary.leftInvites}**\nBonus davet: **${summary.bonusInvites}**\nFake davet: **${summary.fakeInvites}**`,
    });
  },
};

export default command;
