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
  VoiceState,
} from "discord.js";

import { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { getVoiceSettings, updateVoiceSettings } from "../database/repositories/VoiceSettingsRepository.js";

type VoiceInteraction = ChatInputCommandInteraction | ButtonInteraction | ChannelSelectMenuInteraction;

let mainClient: Client | null = null;
let minecraftClient: Client | null = null;

export function setMainClient(client: Client): void {
  mainClient = client;
}

export function setMinecraftClient(client: Client | null): void {
  minecraftClient = client;
}

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

// @discordjs/voice isolates connections by "group".
// Main client uses the default group; MC client uses "mc" group.
// Same guild ID, different groups → two independent connections.
const MAIN_GROUP = "default";
const MC_GROUP = "mc";

function clientGroup(label: string): string {
  return label === "MC" ? MC_GROUP : MAIN_GROUP;
}

function connectVoice(
  client: Client,
  guild: Guild,
  channelId: string,
  label: string,
): void {
  const guildForClient = client.guilds.cache.get(guild.id);
  if (!guildForClient) { console.log(`[Voice:${label}] Sunucu bulunamadı: ${guild.id}`); return; }

  const channel = guildForClient.channels.cache.get(channelId);
  if (!channel || !channel.isVoiceBased()) { console.log(`[Voice:${label}] Geçersiz ses kanalı: ${channelId}`); return; }

  const group = clientGroup(label);
  const existing = getVoiceConnection(guild.id, group);
  const actualChannelId = guildForClient.members.me?.voice.channelId;

  if (existing && existing.joinConfig.channelId === channelId && actualChannelId === channelId) return;

  if (existing) {
    existing.destroy();
  }

  const connection = joinVoiceChannel({
    guildId: guild.id,
    channelId,
    group,
    adapterCreator: guildForClient.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: false,
  });

  connection.on(VoiceConnectionStatus.Ready, () => {
    console.log(`[Voice:${label}] Bağlandı: ${channel.name} (${guild.name})`);
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    console.log(`[Voice:${label}] Bağlantı koptu: ${guild.name}`);
    try {
      await Promise.race([
        new Promise<void>(resolve => {
          connection.once(VoiceConnectionStatus.Ready, () => resolve());
          connection.once(VoiceConnectionStatus.Destroyed, () => resolve());
        }),
        new Promise<void>(resolve => setTimeout(resolve, 5000)),
      ]);
      if (connection.state.status === VoiceConnectionStatus.Disconnected) {
        console.log(`[Voice:${label}] Yeniden bağlanıyor: ${guild.name}`);
        connection.destroy();
        const settings = getVoiceSettings(guild.id);
        if (settings.enabled && settings.channelId) {
          connectVoice(client, guild, settings.channelId, label);
        }
      }
    } catch {
      try {
        const settings = getVoiceSettings(guild.id);
        if (settings.enabled && settings.channelId) {
          connectVoice(client, guild, settings.channelId, label);
        }
      } catch (err) {
        console.error(`[Voice:${label}] Yeniden bağlanma başarısız: ${guild.name}`, err);
      }
    }
  });

  connection.on(VoiceConnectionStatus.Destroyed, () => {
    console.log(`[Voice:${label}] Bağlantı kapatıldı: ${guild.name}`);
  });

  connection.on("error", error => { console.error(`[Voice:${label}] Hata: ${guild.name}`, error); });
}

export function botJoinVoice(client: Client, guild: Guild, channelId: string): void {
  const label = getClientLabel(client);
  connectVoice(client, guild, channelId, label);
}

/** Connect both clients — used by /voiceset enable & channel select. */
function botJoinVoiceBoth(guild: Guild, channelId: string): void {
  if (mainClient) {
    const mainGuild = mainClient.guilds.cache.get(guild.id) ?? guild;
    connectVoice(mainClient, mainGuild, channelId, "Ana");
  }
  if (minecraftClient?.isReady()) {
    const mcGuild = minecraftClient.guilds.cache.get(guild.id);
    if (mcGuild) {
      connectVoice(minecraftClient, mcGuild, channelId, "MC");
    }
  }
}

export function botLeaveVoice(guildId: string): void {
  const mainConn = getVoiceConnection(guildId, MAIN_GROUP);
  if (mainConn) mainConn.destroy();

  const mcConn = getVoiceConnection(guildId, MC_GROUP);
  if (mcConn) mcConn.destroy();
}

// --- Voice state guard: snap back if dragged to wrong channel ---

const guardTimers = new Map<string, ReturnType<typeof setTimeout>>();

function getClientLabel(client: Client): string {
  if (client === mainClient) return "Ana";
  if (client === minecraftClient) return "MC";
  return "?";
}

export async function handleVoiceStateUpdate(
  client: Client,
  oldState: VoiceState,
  newState: VoiceState,
): Promise<void> {
  if (oldState.member?.user.id !== client.user?.id) return;

  const guild = newState.guild ?? oldState.guild;
  if (!guild) return;

  const settings = getVoiceSettings(guild.id);
  if (!settings.enabled || !settings.channelId) return;
  if (newState.channelId === settings.channelId) return;

  // Debounce per guild+client
  const guardKey = `${client.user!.id}:${guild.id}`;
  if (guardTimers.has(guardKey)) return;

  const label = getClientLabel(client);
  console.log(`[Voice:Guard:${label}] Yanlış kanal: ${newState.channelId ?? "yok"} → düzeltiliyor: ${settings.channelId} (${guild.name})`);

  guardTimers.set(guardKey, setTimeout(() => guardTimers.delete(guardKey), 3000));

  connectVoice(client, guild, settings.channelId, label);
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
        if (settings.channelId) botJoinVoiceBoth(guild, settings.channelId);
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
    botJoinVoiceBoth(interaction.guild, channelId);
    await interaction.update(await buildVoicePanel(interaction.guild));
  }
}
