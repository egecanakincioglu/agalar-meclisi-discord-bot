import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import { canModerateTarget, isAdmin } from "../handlers/ModerationHandler.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ban").setDescription("Bir kullanıcıyı sunucudan banlar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option => option.setName("user").setDescription("Banlanacak kullanıcı.").setRequired(true))
    .addStringOption(option => option.setName("reason").setDescription("Ban sebebi.").setRequired(false)),

  async execute(interaction) {
    const allowed = await isAdmin(interaction); if (!allowed) return;
    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "Sebep belirtilmedi.";
    const targetMember = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) { await interaction.reply({ content: "Bu kullanıcı sunucuda bulunamadı.", flags: 64 }); return; }
    const canModerate = await canModerateTarget(interaction, targetMember, "ban");
    if (!canModerate) return;
    await targetMember.ban({ reason });

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle("🔨 Ban")
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        { name: "Kullanıcı", value: `${targetUser} (${targetUser.tag})`, inline: true },
        { name: "Yetkili", value: `${interaction.user}`, inline: true },
        { name: "Sebep", value: reason, inline: false },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
