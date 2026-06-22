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
import { getInviteSummary } from "../database/repositories/InviteRepository.js";

type LeaveInteraction =
  | ChatInputCommandInteraction
  | ButtonInteraction
  | ChannelSelectMenuInteraction;

const CUSTOM_IDS = {
  setup: "leave:setup",
  changeChannel: "leave:change-channel",
  enable: "leave:enable",
  disable: "leave:disable",
  selectChannel: "leave:select-channel",
  back: "leave:back",
};

async function replyHidden(interaction: LeaveInteraction, content: string) {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content, flags: 64 });
  } else {
    await interaction.reply({ content, flags: 64 });
  }
}

export async function ensureLeaveAdmin(interaction: LeaveInteraction): Promise<boolean> {
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

export async function buildLeavePanel(guild: Guild) {
  const settings = getGuildSettings(guild.id);
  const isInstalled = settings.leaveChannelId !== null;
  const isEnabled = settings.leaveEnabled;

  let statusEmoji: string; let statusText: string; let color: number;
  if (isInstalled && isEnabled) { statusEmoji = "🟢"; statusText = "Aktif"; color = 0x57f287; }
  else if (isInstalled && !isEnabled) { statusEmoji = "🔴"; statusText = "Kapalı"; color = 0xed4245; }
  else { statusEmoji = "🟡"; statusText = "Kurulmadı"; color = 0xfee75c; }

  const channelMention = settings.leaveChannelId ? `<#${settings.leaveChannelId}>` : "Ayarlanmadı";

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle("🚪 Ayrılma Sistemi")
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

function buildLeaveChannelSelectPanel() {
  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle("🚪 Ayrılma Kanal Seçimi")
    .setDescription("Ayrılma mesajlarının gönderileceği kanalı seçin.");

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

export async function handleLeaveInteraction(
  interaction: ButtonInteraction | ChannelSelectMenuInteraction,
): Promise<void> {
  if (!interaction.customId.startsWith("leave:")) return;
  const allowed = await ensureLeaveAdmin(interaction);
  if (!allowed) return;
  if (!interaction.guild) return;

  if (interaction.isButton()) {
    const guild = interaction.guild;
    switch (interaction.customId) {
      case CUSTOM_IDS.setup:
      case CUSTOM_IDS.changeChannel:
        await interaction.update(buildLeaveChannelSelectPanel()); return;
      case CUSTOM_IDS.back:
        await interaction.update(await buildLeavePanel(guild)); return;
      case CUSTOM_IDS.enable:
        updateGuildSettings(guild.id, { leaveEnabled: true });
        await interaction.update(await buildLeavePanel(guild)); return;
      case CUSTOM_IDS.disable:
        updateGuildSettings(guild.id, { leaveEnabled: false });
        await interaction.update(await buildLeavePanel(guild)); return;
    }
  }

  if (interaction.isChannelSelectMenu() && interaction.customId === CUSTOM_IDS.selectChannel) {
    updateGuildSettings(interaction.guild.id, {
      leaveChannelId: interaction.values[0],
      leaveEnabled: true,
    });
    await interaction.update(await buildLeavePanel(interaction.guild));
  }
}

export async function sendLeaveMessage(member: GuildMember, inviterId: string | null): Promise<void> {
  const settings = getGuildSettings(member.guild.id);
  if (!settings.leaveEnabled || !settings.leaveChannelId) return;

  const channel = member.guild.channels.cache.get(settings.leaveChannelId);
  if (!channel || !channel.isTextBased()) return;

  const message = `👋 ${member} sunucudan ayrıldı.` +
    (inviterId
      ? ` <@${inviterId}> toplam davet sayısı **${getInviteSummary(member.guild.id, inviterId).netInvites}** oldu!`
      : "");

  if (channel.isSendable()) {
    await channel.send(message).catch(() => {});
  }
}
