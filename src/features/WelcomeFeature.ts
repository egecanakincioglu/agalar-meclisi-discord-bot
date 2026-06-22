import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
} from "discord.js";

import type {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
} from "discord.js";

import { getGuildSettings, updateGuildSettings } from "../database/repositories/GuildSettingsRepository.js";

type WelcomeInteraction =
  | ChatInputCommandInteraction
  | ButtonInteraction
  | ChannelSelectMenuInteraction;

type WelcomeMessageInput = {
  member: GuildMember;
  inviterId: string | null;
  inviteCode: string | null;
  inviterInviteCount: number;
};

const CUSTOM_IDS = {
  setup: "welcome:setup",
  changeChannel: "welcome:change-channel",
  enable: "welcome:enable",
  disable: "welcome:disable",
  selectChannel: "welcome:select-channel",
  back: "welcome:back",
};

async function replyHidden(interaction: WelcomeInteraction, content: string) {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content, flags: 64 });
  } else {
    await interaction.reply({ content, flags: 64 });
  }
}

export async function ensureWelcomeAdmin(interaction: WelcomeInteraction): Promise<boolean> {
  if (!interaction.guild) {
    await replyHidden(interaction, "Bu komut sadece sunucuda kullanılabilir.");
    return false;
  }

  const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  if (!member || !member.permissions.has("Administrator")) {
    await replyHidden(interaction, "Bu işlemi yapmak için yönetici yetkisine sahip olmalısın.");
    return false;
  }

  return true;
}

export async function buildWelcomePanel(guild: Guild) {
  const settings = getGuildSettings(guild.id);
  const isInstalled = settings.welcomeChannelId !== null;
  const isEnabled = settings.welcomeEnabled;

  let statusEmoji: string; let statusText: string; let color: number;
  if (isInstalled && isEnabled) { statusEmoji = "🟢"; statusText = "Aktif"; color = 0x57f287; }
  else if (isInstalled && !isEnabled) { statusEmoji = "🔴"; statusText = "Kapalı"; color = 0xed4245; }
  else { statusEmoji = "🟡"; statusText = "Kurulmadı"; color = 0xfee75c; }

  const channelMention = settings.welcomeChannelId ? `<#${settings.welcomeChannelId}>` : "Ayarlanmadı";

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle("👋 Hoş Geldin Sistemi")
    .addFields(
      { name: "Durum", value: `${statusEmoji} **${statusText}**`, inline: true },
      { name: "Kanal", value: channelMention, inline: true },
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(isInstalled ? CUSTOM_IDS.changeChannel : CUSTOM_IDS.setup)
      .setLabel(isInstalled ? "Kanal Değiştir" : "Kurulum Yap")
      .setStyle(isInstalled ? ButtonStyle.Secondary : ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.enable).setLabel("Aç").setStyle(ButtonStyle.Success)
      .setDisabled(!isInstalled || isEnabled),
    new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.disable).setLabel("Kapat").setStyle(ButtonStyle.Danger)
      .setDisabled(!isInstalled || !isEnabled),
  );

  return { embeds: [embed], components: [row] };
}

function buildWelcomeChannelSelectPanel() {
  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle("👋 Hoş Geldin Kanal Seçimi")
    .setDescription("Hoş geldin mesajlarının gönderileceği kanalı seçin.");

  const selectRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(CUSTOM_IDS.selectChannel)
      .setPlaceholder("Kanal seçin...")
      .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setMinValues(1).setMaxValues(1),
  );

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.back).setLabel("Geri Dön").setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [selectRow, buttonRow] };
}

export async function handleWelcomeInteraction(
  interaction: ButtonInteraction | ChannelSelectMenuInteraction,
): Promise<void> {
  if (!interaction.customId.startsWith("welcome:")) return;
  const allowed = await ensureWelcomeAdmin(interaction);
  if (!allowed) return;
  if (!interaction.guild) return;

  if (interaction.isButton()) {
    const guild = interaction.guild;
    switch (interaction.customId) {
      case CUSTOM_IDS.setup:
      case CUSTOM_IDS.changeChannel:
        await interaction.update(buildWelcomeChannelSelectPanel()); return;
      case CUSTOM_IDS.back:
        await interaction.update(await buildWelcomePanel(guild)); return;
      case CUSTOM_IDS.enable:
        updateGuildSettings(guild.id, { welcomeEnabled: true });
        await interaction.update(await buildWelcomePanel(guild)); return;
      case CUSTOM_IDS.disable:
        updateGuildSettings(guild.id, { welcomeEnabled: false });
        await interaction.update(await buildWelcomePanel(guild)); return;
    }
  }

  if (interaction.isChannelSelectMenu() && interaction.customId === CUSTOM_IDS.selectChannel) {
    updateGuildSettings(interaction.guild.id, {
      welcomeChannelId: interaction.values[0],
      welcomeEnabled: true,
    });
    await interaction.update(await buildWelcomePanel(interaction.guild));
  }
}

export async function sendWelcomeMessage(input: WelcomeMessageInput): Promise<void> {
  const settings = getGuildSettings(input.member.guild.id);
  if (!settings.welcomeEnabled || !settings.welcomeChannelId) return;

  const channel = input.member.guild.channels.cache.get(settings.welcomeChannelId);
  if (!channel || !channel.isTextBased()) return;

  const message = `🎉 ${input.member} sunucuya hoş geldin.` +
    (input.inviterId
      ? ` <@${input.inviterId}> toplam davet sayısı **${input.inviterInviteCount}** oldu!`
      : "");

  if (channel.isSendable()) {
    await channel.send(message).catch(() => {});
  }
}
