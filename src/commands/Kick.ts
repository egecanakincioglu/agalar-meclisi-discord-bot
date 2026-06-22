import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import { canModerateTarget, isAdmin } from "../handlers/ModerationHandler.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("kick").setDescription("Bir kullanıcıyı sunucudan atar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option => option.setName("user").setDescription("Atılacak kullanıcı.").setRequired(true))
    .addStringOption(option => option.setName("reason").setDescription("Kick sebebi.").setRequired(false)),

  async execute(interaction) {
    const allowed = await isAdmin(interaction); if (!allowed) return;
    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "Sebep belirtilmedi.";
    const targetMember = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) { await interaction.reply({ content: "Bu kullanıcı sunucuda bulunamadı.", flags: 64 }); return; }
    const canModerate = await canModerateTarget(interaction, targetMember, "kick");
    if (!canModerate) return;
    await targetMember.kick(reason);

    const embed = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle("👢 Kick")
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
