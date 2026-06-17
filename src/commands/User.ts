import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";
import { getMemberLevel, xpForNextLevel, getLevelRank, getLevelSettings } from "../database/repositories/LevelRepository.js";

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
}

const command: Command = {
  data: new SlashCommandBuilder().setName("user").setDescription("Bir kullanıcının detaylı bilgilerini gösterir.")
    .addUserOption(option => option.setName("user").setDescription("Bilgisine bakılacak kullanıcı.").setRequired(false)),

  async execute(interaction) {
    if (!interaction.guild) { await interaction.reply({ content: "Bu komut sadece sunucuda kullanılabilir.", flags: 64 }); return; }
    const user = interaction.options.getUser("user") ?? interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const embed = new EmbedBuilder().setColor(0x2b2d31)
      .setAuthor({ name: `${user.username} • Kullanıcı Bilgisi`, iconURL: user.displayAvatarURL() })
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields({ name: "👤 Hesap", value: `**Kullanıcı:** ${user.tag}\n**ID:** ${user.id}\n**Bot:** ${user.bot ? "Evet" : "Hayır"}\n**Hesap Tarihi:** ${formatDate(user.createdTimestamp)}`, inline: false });

    if (member) {
      const roles = member.roles.cache.filter(r => r.name !== "@everyone").sort((a, b) => b.position - a.position).map(r => r.toString()).join(", ");
      embed.addFields({ name: "📋 Sunucu", value: `**Takma Ad:** ${member.displayName}\n**Katılım:** ${formatDate(member.joinedTimestamp ?? 0)}\n**Roller (${member.roles.cache.size - 1}):** ${roles || "Yok"}`, inline: false });
    }

    const levelEnabled = getLevelSettings(interaction.guild.id).enabled;
    if (levelEnabled) {
      const levelData = getMemberLevel(interaction.guild.id, user.id);
      const rank = getLevelRank(interaction.guild.id, user.id);
      const needed = xpForNextLevel(levelData.level);
      embed.addFields({ name: "⭐ Seviye", value: `**Seviye:** ${levelData.level} (#${rank}. sırada)\n**XP:** ${levelData.xp} / ${needed}`, inline: false });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
export default command;
