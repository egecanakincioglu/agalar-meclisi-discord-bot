import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import { buildAutorolePanel, ensureAutoroleAdmin } from "../features/AutoroleFeature.js";

const command: Command = {
  data: new SlashCommandBuilder().setName("autorole").setDescription("Otorol sistemini yönetir.").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const allowed = await ensureAutoroleAdmin(interaction); if (!allowed) return;
    if (!interaction.guild) { await interaction.reply({ content: "Bu komut sadece sunucuda kullanılabilir.", flags: 64 }); return; }
    const panel = await buildAutorolePanel(interaction.guild);
    await interaction.reply({ ...panel, flags: 64 });
  },
};
export default command;
