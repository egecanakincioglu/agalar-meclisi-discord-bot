import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import { getInviteSummary, getInviteLeaderboard } from "../database/repositories/InviteRepository.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("invites")
    .setDescription("Davet bilgilerini gösterir.")
    .addUserOption(option =>
      option.setName("user").setDescription("Davet bilgisine bakılacak kullanıcı.").setRequired(false)),

  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "Bu komut sadece sunucuda kullanılabilir.", flags: 64 });
      return;
    }

    const user = interaction.options.getUser("user") ?? interaction.user;
    const summary = getInviteSummary(interaction.guildId, user.id);
    const lb = getInviteLeaderboard(interaction.guildId, 999);
    const rank = lb.findIndex(r => r.userId === user.id) + 1;

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        {
          name: "🏆 Sıralama",
          value: rank > 0 ? `**#${rank}**` : "Henüz sıralamada değil",
          inline: true,
        },
        {
          name: "📊 Net Davet",
          value: `**${summary.netInvites}**`,
          inline: true,
        },
        {
          name: "​",
          value: "​",
          inline: true,
        },
        {
          name: "✅ Aktif",
          value: `**${summary.activeInvites}**`,
          inline: true,
        },
        {
          name: "👋 Ayrılan",
          value: `**${summary.leftInvites}**`,
          inline: true,
        },
        {
          name: "📥 Toplam",
          value: `**${summary.totalInvites}**`,
          inline: true,
        },
      );

    if (summary.bonusInvites > 0 || summary.fakeInvites > 0) {
      embed.addFields(
        {
          name: "🎁 Bonus",
          value: `**${summary.bonusInvites}**`,
          inline: true,
        },
        {
          name: "⚠️ Fake",
          value: `**${summary.fakeInvites}**`,
          inline: true,
        },
        { name: "​", value: "​", inline: true },
      );
    }

    embed.setFooter({ text: `${interaction.guild?.name ?? "Sunucu"} • /top ile sıralamayı gör` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
