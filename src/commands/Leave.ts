import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import { buildLeavePanel, ensureLeaveAdmin } from "../features/LeaveFeature.js";

const command: Command = {
  data: new SlashCommandBuilder().setName("leave").setDescription("Leave sistemini yönetir.").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const allowed = await ensureLeaveAdmin(interaction); if (!allowed) return;
    if (!interaction.guild) { await interaction.reply({ content: "Bu komut sadece sunucuda kullanılabilir.", flags: 64 }); return; }
    const panel = await buildLeavePanel(interaction.guild);
    await interaction.reply({ ...panel, flags: 64 });
  },
};
export default command;
