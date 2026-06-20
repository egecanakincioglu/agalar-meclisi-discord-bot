import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import { buildLevelPanel, ensureLevelAdmin } from "../features/LevelFeature.js";

const command: Command = {
  data: new SlashCommandBuilder().setName("levelset").setDescription("Seviye sistemi yönetim panelini açar.").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const allowed = await ensureLevelAdmin(interaction); if (!allowed) return;
    if (!interaction.guild) { await interaction.reply({ content: "Bu komut sadece sunucuda kullanılabilir.", flags: 64 }); return; }
    const panel = await buildLevelPanel(interaction.guild);
    await interaction.reply({ ...panel, flags: 64 });
  },
};
export default command;
