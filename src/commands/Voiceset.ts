import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import { buildVoicePanel, ensureVoiceAdmin } from "../features/VoiceFeature.js";

const command: Command = {
  data: new SlashCommandBuilder().setName("voiceset").setDescription("Ses sistemi yönetim panelini açar.").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const allowed = await ensureVoiceAdmin(interaction); if (!allowed) return;
    if (!interaction.guild) { await interaction.reply({ content: "Bu komut sadece sunucuda kullanılabilir.", flags: 64 }); return; }
    const panel = await buildVoicePanel(interaction.guild);
    await interaction.reply({ ...panel, flags: 64 });
  },
};
export default command;
