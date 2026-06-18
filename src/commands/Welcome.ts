import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import { buildWelcomePanel, ensureWelcomeAdmin } from "../features/WelcomeFeature.js";

const command: Command = {
  data: new SlashCommandBuilder().setName("welcome").setDescription("Welcome sistemini yönetir.").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const allowed = await ensureWelcomeAdmin(interaction); if (!allowed) return;
    if (!interaction.guild) { await interaction.reply({ content: "Bu komut sadece sunucuda kullanılabilir.", flags: 64 }); return; }
    const panel = await buildWelcomePanel(interaction.guild);
    await interaction.reply({ ...panel, flags: 64 });
  },
};
export default command;
