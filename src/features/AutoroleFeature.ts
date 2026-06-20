import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  RoleSelectMenuBuilder,
} from "discord.js";

import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Guild,
  RoleSelectMenuInteraction,
} from "discord.js";

import { getGuildSettings, updateGuildSettings } from "../database/repositories/GuildSettingsRepository.js";

type AutoroleInteraction =
  | ChatInputCommandInteraction
  | ButtonInteraction
  | RoleSelectMenuInteraction;

const CUSTOM_IDS = {
  setup: "autorole:setup",
  changeRole: "autorole:change-role",
  enable: "autorole:enable",
  disable: "autorole:disable",
  selectRole: "autorole:select-role",
  back: "autorole:back",
};

async function replyHidden(interaction: AutoroleInteraction, content: string) {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content, flags: 64 });
  } else {
    await interaction.reply({ content, flags: 64 });
  }
}

export async function ensureAutoroleAdmin(interaction: AutoroleInteraction): Promise<boolean> {
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

export async function buildAutorolePanel(guild: Guild) {
  const settings = getGuildSettings(guild.id);
  const isInstalled = settings.autoRoleId !== null;
  const isEnabled = settings.autoRoleEnabled;

  let statusEmoji: string; let statusText: string; let color: number;
  if (isInstalled && isEnabled) { statusEmoji = "🟢"; statusText = "Aktif"; color = 0x57f287; }
  else if (isInstalled && !isEnabled) { statusEmoji = "🔴"; statusText = "Kapalı"; color = 0xed4245; }
  else { statusEmoji = "🟡"; statusText = "Kurulmadı"; color = 0xfee75c; }

  const roleMention = settings.autoRoleId ? `<@&${settings.autoRoleId}>` : "Ayarlanmadı";

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle("🎭 Otorol Sistemi")
    .addFields(
      { name: "Durum", value: `${statusEmoji} **${statusText}**`, inline: true },
      { name: "Rol", value: roleMention, inline: true },
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(isInstalled ? CUSTOM_IDS.changeRole : CUSTOM_IDS.setup)
      .setLabel(isInstalled ? "Rol Değiştir" : "Kurulum Yap")
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

function buildAutoroleSelectPanel() {
  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle("🎭 Otorol Seçimi")
    .setDescription("Yeni katılan üyelere otomatik verilecek rolü seçin.");

  const selectRow = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
    new RoleSelectMenuBuilder()
      .setCustomId(CUSTOM_IDS.selectRole)
      .setPlaceholder("Rol seçin...")
      .setMinValues(1).setMaxValues(1),
  );

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.back).setLabel("Geri Dön").setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [selectRow, buttonRow] };
}

export async function handleAutoroleInteraction(
  interaction: ButtonInteraction | RoleSelectMenuInteraction,
): Promise<void> {
  if (!interaction.customId.startsWith("autorole:")) return;
  const allowed = await ensureAutoroleAdmin(interaction);
  if (!allowed) return;
  if (!interaction.guild) return;

  if (interaction.isButton()) {
    const guild = interaction.guild;
    switch (interaction.customId) {
      case CUSTOM_IDS.setup:
      case CUSTOM_IDS.changeRole:
        await interaction.update(buildAutoroleSelectPanel()); return;
      case CUSTOM_IDS.back:
        await interaction.update(await buildAutorolePanel(guild)); return;
      case CUSTOM_IDS.enable:
        updateGuildSettings(guild.id, { autoRoleEnabled: true });
        await interaction.update(await buildAutorolePanel(guild)); return;
      case CUSTOM_IDS.disable:
        updateGuildSettings(guild.id, { autoRoleEnabled: false });
        await interaction.update(await buildAutorolePanel(guild)); return;
    }
  }

  if (interaction.isRoleSelectMenu() && interaction.customId === CUSTOM_IDS.selectRole) {
    updateGuildSettings(interaction.guild.id, {
      autoRoleId: interaction.values[0],
      autoRoleEnabled: true,
    });
    await interaction.update(await buildAutorolePanel(interaction.guild));
  }
}
