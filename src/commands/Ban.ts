import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
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
    await interaction.reply({ content: `${targetUser} sunucudan banlandı.\nYetkili: ${interaction.user}\nSebep: **${reason}**` });
  },
};

export default command;
