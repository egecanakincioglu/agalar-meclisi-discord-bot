import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import { getMemberLevel, xpForNextLevel, getLevelRank, getLevelSettings } from "../database/repositories/LevelRepository.js";

function progressBar(current: number, needed: number, length = 10): string {
  const progress = Math.min(current / needed, 1);
  const filled = Math.round(progress * length);
  return "🟩".repeat(filled) + "⬛".repeat(length - filled);
}

const command: Command = {
  data: new SlashCommandBuilder().setName("level").setDescription("Seviye ve XP bilgini gösterir.")
    .addUserOption(option => option.setName("user").setDescription("Leveline bakılacak kullanıcı.").setRequired(false)),

  async execute(interaction) {
    if (!interaction.guildId) { await interaction.reply({ content: "Bu komut sadece sunucuda kullanılabilir.", flags: 64 }); return; }
    const settings = getLevelSettings(interaction.guildId);
    if (!settings.enabled) { await interaction.reply({ content: "Seviye sistemi bu sunucuda aktif değil.", flags: 64 }); return; }

    const user = interaction.options.getUser("user") ?? interaction.user;
    const member = getMemberLevel(interaction.guildId, user.id);
    const rank = getLevelRank(interaction.guildId, user.id);
    const needed = xpForNextLevel(member.level);

    const embed = new EmbedBuilder().setColor(0xfee75c)
      .setAuthor({ name: `${user.username} • Seviye Bilgisi`, iconURL: user.displayAvatarURL() })
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "🏆 Seviye", value: `**${member.level}** (#${rank}. sırada)`, inline: true },
        { name: "⭐ XP", value: `**${member.xp}** / ${needed}`, inline: true },
        { name: "📊 İlerleme", value: `${progressBar(member.xp, needed)} (${Math.round((member.xp / needed) * 100)}%)`, inline: false },
      )
      .setFooter({ text: `Seviye atlamak için ${needed - member.xp} XP kaldı` });

    await interaction.reply({ embeds: [embed] });
  },
};
export default command;
