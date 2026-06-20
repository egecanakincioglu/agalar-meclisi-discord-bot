import { ChannelType, Collection, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { GuildTextBasedChannel, Message, TextChannel, NewsChannel } from "discord.js";
import type { Command } from "../types/Command.js";
import { isAdmin } from "../handlers/ModerationHandler.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("delete").setDescription("Belirtilen sayıda mesajı siler (max 1000).")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(option => option.setName("sayi").setDescription("Silinecek mesaj sayısı (1-1000).").setMinValue(1).setMaxValue(1000).setRequired(true)),

  async execute(interaction) {
    const allowed = await isAdmin(interaction); if (!allowed) return;
    if (!interaction.channel || !interaction.guild) { await interaction.reply({ content: "Bu komut sadece sunucu kanallarında kullanılabilir.", flags: 64 }); return; }
    const channel = interaction.channel as GuildTextBasedChannel;
    if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
      await interaction.reply({ content: "Bu komut sadece yazı kanallarında kullanılabilir.", flags: 64 }); return;
    }
    const count = interaction.options.getInteger("sayi", true);
    await interaction.deferReply({ flags: 64 });

    try {
      const textChannel = channel as TextChannel | NewsChannel;
      const allMessages = new Collection<string, Message<true>>();
      let lastId: string | undefined;

      while (allMessages.size < count) {
        const remaining = count - allMessages.size;
        const fetchLimit = Math.min(remaining, 100);
        const batch = await textChannel.messages.fetch({ limit: fetchLimit, ...(lastId ? { before: lastId } : {}) });
        if (batch.size === 0) break;
        for (const [id, msg] of batch) allMessages.set(id, msg);
        const lastMsg = batch.last(); if (lastMsg) lastId = lastMsg.id;
        if (batch.size < fetchLimit) break;
      }

      const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const validMessages = allMessages.filter(m => m.createdTimestamp > fourteenDaysAgo);
      const oldCount = allMessages.size - validMessages.size;
      const deletedMessages = await textChannel.bulkDelete(validMessages, true);
      const deletedCount = deletedMessages.size;

      let content = `✅ **${deletedCount}** mesaj silindi.`;
      if (oldCount > 0) content += `\n⚠️ **${oldCount}** mesaj 14 günden eski olduğu için silinemedi.`;
      await interaction.editReply({ content });
    } catch (error) {
      console.error("/delete komut hatası:", error);
      await interaction.editReply({ content: "Mesajlar silinirken bir hata oluştu." });
    }
  },
};

export default command;
