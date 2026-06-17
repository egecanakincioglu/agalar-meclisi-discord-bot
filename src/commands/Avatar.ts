import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("avatar").setDescription("Bir kullanıcının avatarını gösterir.")
    .addUserOption(option => option.setName("user").setDescription("Avatarına bakılacak kullanıcı.").setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser("user") ?? interaction.user;
    const embed = new EmbedBuilder()
      .setTitle(`${user.username} - Avatar`)
      .setImage(user.displayAvatarURL({ size: 1024 }))
      .setColor(0x2b2d31)
      .setFooter({ text: `İsteyen: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
