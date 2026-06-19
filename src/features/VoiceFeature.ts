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
  Client,
  Guild,
} from "discord.js";

import { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { getVoiceSettings, updateVoiceSettings } from "../database/repositories/VoiceSettingsRepository.js";

type VoiceInteraction = ChatInputCommandInteraction | ButtonInteraction | ChannelSelectMenuInteraction;

const CUSTOM_IDS = {
  setup: "voiceset:setup",
  changeChannel: "voiceset:change-channel",
  enable: "voiceset:enable",
  disable: "voiceset:disable",
  selectChannel: "voiceset:select-channel",
  back: "voiceset:back",
};

async function replyHidden(interaction: VoiceInteraction, content: string) {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content, flags: 64 });
  } else {
    await interaction.reply({ content, flags: 64 });
  }
}

export async function ensureVoiceAdmin(interaction: VoiceInteraction): Promise<boolean> {
  if (!interaction.guild) { await replyHidden(interaction, "Bu komut sadece sunucuda kullanılabilir."); return false; }
  const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  if (!member || !member.permissions.has("Administrator")) {
    await replyHidden(interaction, "Bu işlemi yapmak için yönetici yetkisine sahip olmalısın.");
    return false;
  }
  return true;
}

export async function buildVoicePanel(guild: Guild) {
  const settings = getVoiceSettings(guild.id);
  const isInstalled = settings.channelId !== null;
  const isEnabled = settings.enabled;

  let statusEmoji: string; let statusText: string; let color: number;
  if (isInstalled && isEnabled) { statusEmoji = "🟢"; statusText = "Aktif"; color = 0x57f287; }
  else if (isInstalled && !isEnabled) { statusEmoji = "🔴"; statusText = "Kapalı"; color = 0xed4245; }
  else { statusEmoji = "🟡"; statusText = "Kurulmadı"; color = 0xfee75c; }

  const channelMention = settings.channelId ? `<#${settings.channelId}>` : "Ayarlanmadı";

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle("🎤 Ses Sistemi Yönetimi")
    .addFields(
      { name: "Durum", value: `${statusEmoji} **${statusText}**`, inline: true },
      { name: "Ses Kanalı", value: channelMention, inline: true },
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

function buildVoiceChannelSelectPanel() {
  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle("🎤 Ses Kanalı Seçimi")
    .setDescription("Botun bağlanacağı ses kanalını seçin.");

  const selectRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(CUSTOM_IDS.selectChannel)
      .setPlaceholder("Ses kanalı seçin...")
      .setChannelTypes(ChannelType.GuildVoice)
      .setMinValues(1).setMaxValues(1),
  );

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(CUSTOM_IDS.back).setLabel("Geri Dön").setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [selectRow, buttonRow] };
}

export function botJoinVoice(client: Client, guild: Guild, channelId: string): void {
  const channel = guild.channels.cache.get(channelId);
  if (!channel || !channel.isVoiceBased()) { console.log(`[Voice] Geçersiz ses kanalı: ${channelId}`); return; }

  const existing = getVoiceConnection(guild.id);
  if (existing && existing.joinConfig.channelId === channelId) return;

  const connection = joinVoiceChannel({
    guildId: guild.id, channelId,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true, selfMute: false,
  });

  connection.on(VoiceConnectionStatus.Ready, () => {
    console.log(`[Voice] Bağlandı: ${channel.name} (${guild.name})`);
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    console.log(`[Voice] Bağlantı koptu: ${guild.name}`);
    try {
      await Promise.race([
        new Promise<void>(resolve => {
          connection.once(VoiceConnectionStatus.Ready, () => resolve());
          connection.once(VoiceConnectionStatus.Destroyed, () => resolve());
        }),
        new Promise<void>(resolve => setTimeout(resolve, 5000)),
      ]);
      if (connection.state.status === VoiceConnectionStatus.Disconnected) {
        console.log(`[Voice] Yeniden bağlanıyor: ${guild.name}`);
        connection.destroy();
        botJoinVoice(client, guild, channelId);
      }
    } catch {
      try { botJoinVoice(client, guild, channelId); } catch (err) {
        console.error(`[Voice] Yeniden bağlanma başarısız: ${guild.name}`, err);
      }
    }
  });

  connection.on(VoiceConnectionStatus.Destroyed, () => {
    console.log(`[Voice] Bağlantı kapatıldı: ${guild.name}`);
  });

  connection.on("error", error => { console.error(`[Voice] Hata: ${guild.name}`, error); });
}

export function botLeaveVoice(guildId: string): void {
  const connection = getVoiceConnection(guildId);
  if (connection) connection.destroy();
}

export async function handleVoiceInteraction(
  interaction: ButtonInteraction | ChannelSelectMenuInteraction,
): Promise<void> {
  if (!interaction.customId.startsWith("voiceset:")) return;
  const allowed = await ensureVoiceAdmin(interaction);
  if (!allowed) return;
  if (!interaction.guild) return;

  if (interaction.isButton()) {
    const guild = interaction.guild;
    switch (interaction.customId) {
      case CUSTOM_IDS.setup:
      case CUSTOM_IDS.changeChannel:
        await interaction.update(buildVoiceChannelSelectPanel()); return;
      case CUSTOM_IDS.back:
        await interaction.update(await buildVoicePanel(guild)); return;
      case CUSTOM_IDS.enable: {
        updateVoiceSettings(guild.id, { enabled: true });
        const settings = getVoiceSettings(guild.id);
        if (settings.channelId) botJoinVoice(interaction.client, guild, settings.channelId);
        await interaction.update(await buildVoicePanel(guild)); return;
      }
      case CUSTOM_IDS.disable: {
        updateVoiceSettings(guild.id, { enabled: false });
        botLeaveVoice(guild.id);
        await interaction.update(await buildVoicePanel(guild)); return;
      }
    }
  }

  if (interaction.isChannelSelectMenu() && interaction.customId === CUSTOM_IDS.selectChannel) {
    const channelId = interaction.values[0];
    updateVoiceSettings(interaction.guild.id, { channelId, enabled: true });
    botJoinVoice(interaction.client, interaction.guild, channelId);
    await interaction.update(await buildVoicePanel(interaction.guild));
  }
}
