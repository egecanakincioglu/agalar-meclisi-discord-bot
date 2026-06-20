import { ChannelType, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { NewsChannel, TextChannel } from "discord.js";
import type { Command } from "../types/Command.js";
import { isAdmin } from "../handlers/ModerationHandler.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("announce").setDescription("Seçilen kanala duyuru gönderir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option => option.setName("channel").setDescription("Duyurunun gönderileceği kanal.").addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true))
    .addStringOption(option => option.setName("message").setDescription("Duyuru mesajı.").setRequired(true))
    .addStringOption(option => option.setName("title").setDescription("Duyuru başlığı.").setRequired(false))
    .addBooleanOption(option => option.setName("everyone").setDescription("@everyone etiketi atılsın mı?").setRequired(false)),

  async execute(interaction) {
    const allowed = await isAdmin(interaction); if (!allowed) return;
    const channel = interaction.options.getChannel("channel", true);
    const message = interaction.options.getString("message", true);
    const title = interaction.options.getString("title") ?? "Duyuru";
    const mentionEveryone = interaction.options.getBoolean("everyone") ?? false;

    if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
      await interaction.reply({ content: "Duyuru göndermek için yazı kanalı seçmelisin.", flags: 64 }); return;
    }

    if (message.length > 4000) {
      await interaction.reply({ content: "Duyuru mesajı çok uzun.", flags: 64 }); return;
    }

    const targetChannel = channel as TextChannel | NewsChannel;
    const embed = new EmbedBuilder().setTitle(title).setDescription(message).setColor(0x2b2d31).setTimestamp()
      .setFooter({ text: `Duyuru yapan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

    await targetChannel.send({ content: mentionEveryone ? "@everyone" : undefined, embeds: [embed], allowedMentions: { parse: mentionEveryone ? ["everyone"] : [] } });
    await interaction.reply({ content: `Duyuru ${targetChannel} kanalına gönderildi.`, flags: 64 });
  },
};

export default command;
