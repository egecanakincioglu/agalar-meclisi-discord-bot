import { ChannelType, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

const VERIFICATION_LEVELS: Record<number, string> = { 0: "Yok", 1: "Düşük (E-posta doğrulanmış)", 2: "Orta (5 dakika üye)", 3: "Yüksek (10 dakika üye)", 4: "Çok Yüksek (Telefon doğrulanmış)" };
const CONTENT_FILTERS: Record<number, string> = { 0: "Kapalı", 1: "Rolü olmayan üyeleri tara", 2: "Tüm mesajları tara" };
const NSFW_LEVELS: Record<number, string> = { 0: "Yok", 1: "Yaş kısıtlamalı kanallar var", 2: "Yaş kısıtlamalı kanallar fazla", 3: "Tüm kanallar yaş kısıtlamalı" };
const MFA_LEVELS: Record<number, string> = { 0: "Kapalı", 1: "Açık" };

const command: Command = {
  data: new SlashCommandBuilder().setName("server").setDescription("Sunucu hakkında detaylı bilgileri gösterir."),
  async execute(interaction) {
    if (!interaction.guild) { await interaction.reply({ content: "Bu komut sadece sunucuda kullanılabilir.", flags: 64 }); return; }
    const guild = interaction.guild;
    await guild.fetch();
    const owner = await guild.fetchOwner();

    const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice).size;
    const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;
    const forumChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildForum || c.type === ChannelType.GuildMedia).size;
    const totalChannels = guild.channels.cache.size;
    const staticEmojis = guild.emojis.cache.filter(e => !e.animated).size;
    const animatedEmojis = guild.emojis.cache.filter(e => e.animated).size;
    const boostTier = guild.premiumTier === 3 ? "3. Seviye (En yüksek)" : `${guild.premiumTier}. Seviye`;
    const createdAt = formatDate(guild.createdTimestamp);
    const daysAgo = Math.floor((Date.now() - guild.createdTimestamp) / (1000 * 60 * 60 * 24));

    const embed = new EmbedBuilder().setColor(0x2b2d31)
      .setAuthor({ name: guild.name, iconURL: guild.iconURL() ?? undefined })
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: "📋 Genel Bilgiler", value: `**İsim:** ${guild.name}\n**ID:** ${guild.id}\n**Kurucu:** ${owner.user.tag}\n**Kuruluş:** ${createdAt}\n**Sunucu Yaşı:** ${daysAgo} gün\n**Açıklama:** ${guild.description || "Yok"}\n**Dil:** ${guild.preferredLocale}`, inline: false },
        { name: "👥 Üyeler", value: `**Toplam Üye:** ${guild.memberCount}\n**Roller:** ${guild.roles.cache.size}`, inline: true },
        { name: "💬 Kanallar", value: `**Yazı:** ${textChannels}\n**Ses:** ${voiceChannels}\n**Forum:** ${forumChannels}\n**Kategori:** ${categories}\n**Toplam:** ${totalChannels}`, inline: true },
        { name: "🚀 Boost", value: `**Seviye:** ${boostTier}\n**Boost Sayısı:** ${guild.premiumSubscriptionCount}`, inline: true },
        { name: "😀 Emojiler", value: `**Statik:** ${staticEmojis}\n**Hareketli:** ${animatedEmojis}\n**Toplam:** ${guild.emojis.cache.size}`, inline: true },
        { name: "🛡️ Güvenlik", value: `**Doğrulama:** ${VERIFICATION_LEVELS[guild.verificationLevel]}\n**İçerik Filtresi:** ${CONTENT_FILTERS[guild.explicitContentFilter]}\n**NSFW:** ${NSFW_LEVELS[guild.nsfwLevel]}\n**2FA Zorunlu:** ${MFA_LEVELS[guild.mfaLevel]}`, inline: true },
      )
      .setFooter({ text: `İsteyen: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 512 }));
    if (guild.features.length > 0) {
      const featureNames: Record<string, string> = { ANIMATED_BANNER: "Animasyonlu Banner", ANIMATED_ICON: "Animasyonlu İkon", BANNER: "Banner", COMMUNITY: "Topluluk Sunucusu", DISCOVERABLE: "Keşfedilebilir", FEATURABLE: "Öne Çıkarılabilir", INVITE_SPLASH: "Davet Arka Planı", NEWS: "Duyuru Kanalları", PARTNERED: "Partner", PREVIEW_ENABLED: "Önizleme", VANITY_URL: "Özel URL", VERIFIED: "Doğrulanmış", VIP_REGIONS: "VIP Ses Bölgeleri", WELCOME_SCREEN_ENABLED: "Hoş Geldin Ekranı", TICKETED_EVENTS_ENABLED: "Biletli Etkinlikler", MONETIZATION_ENABLED: "Para Kazanma", ROLE_ICONS: "Rol İkonları", GUILD_ONBOARDING: "Sunucu Rehberi", GUILD_SERVER_GUIDE: "Sunucu Rehberi" };
      const featuresText = guild.features.map(f => featureNames[f] || f).join(", ");
      if (featuresText.length <= 1024) embed.addFields({ name: "⭐ Özellikler", value: featuresText, inline: false });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
export default command;
