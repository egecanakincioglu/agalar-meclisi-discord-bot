import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

import type { ButtonInteraction, ChatInputCommandInteraction, Guild, Message } from "discord.js";

import { getLevelSettings, updateLevelSettings, addXp, getMemberLevel } from "../database/repositories/LevelRepository.js";

type LevelInteraction = ChatInputCommandInteraction | ButtonInteraction;

const CUSTOM_IDS = { enable: "levelset:enable", disable: "levelset:disable" };

async function replyHidden(interaction: LevelInteraction, content: string) {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content, flags: 64 });
  } else {
    await interaction.reply({ content, flags: 64 });
  }
}

export async function ensureLevelAdmin(interaction: LevelInteraction): Promise<boolean> {
  if (!interaction.guild) { await replyHidden(interaction, "Bu komut sadece sunucuda kullanılabilir."); return false; }
  const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  if (!member || !member.permissions.has("Administrator")) {
    await replyHidden(interaction, "Bu işlemi yapmak için yönetici yetkisine sahip olmalısın.");
    return false;
  }
  return true;
}

export async function buildLevelPanel(guild: Guild) {
  const settings = getLevelSettings(guild.id);
  const isEnabled = settings.enabled;

  const embed = new EmbedBuilder()
    .setColor(isEnabled ? 0x57f287 : 0xed4245)
    .setTitle("⭐ Seviye Sistemi Yönetimi")
    .addFields(
      {
        name: "Durum",
        value: isEnabled ? "🟢 **Aktif** — Kullanıcılar mesaj yazdıkça XP kazanır." : "🔴 **Kapalı** — Seviye takibi yapılmaz.",
        inline: false,
      },
      {
        name: "XP Formülü",
        value: "Başlangıç seviyesi: **1**\nHer mesaj: **5–15 XP** (rastgele)\nSeviye atlama: **200 × seviye** XP gerekli\nCooldown: **60 saniye**",
        inline: false,
      },
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(CUSTOM_IDS.enable).setLabel("Aç").setStyle(ButtonStyle.Success).setDisabled(isEnabled),
    new ButtonBuilder().setCustomId(CUSTOM_IDS.disable).setLabel("Kapat").setStyle(ButtonStyle.Danger).setDisabled(!isEnabled),
  );

  return { embeds: [embed], components: [row] };
}

export async function handleLevelInteraction(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.customId.startsWith("levelset:")) return;
  const allowed = await ensureLevelAdmin(interaction);
  if (!allowed) return;
  if (!interaction.guild) return;

  switch (interaction.customId) {
    case CUSTOM_IDS.enable:
      updateLevelSettings(interaction.guild.id, { enabled: true });
      await interaction.update(await buildLevelPanel(interaction.guild)); return;
    case CUSTOM_IDS.disable:
      updateLevelSettings(interaction.guild.id, { enabled: false });
      await interaction.update(await buildLevelPanel(interaction.guild)); return;
  }
}

export async function handleMessageXp(message: Message): Promise<void> {
  if (!message.guild || message.author.bot) return;

  const settings = getLevelSettings(message.guild.id);
  if (!settings.enabled) return;

  const guildId = message.guild.id;
  const userId = message.author.id;

  const member = getMemberLevel(guildId, userId);
  if (member.lastMessageAt) {
    const lastTime = new Date(member.lastMessageAt).getTime();
    if (Date.now() - lastTime < 60_000) return;
  }

  const xp = Math.floor(Math.random() * 11) + 5;
  const result = addXp(guildId, userId, xp);

  if (result.leveledUp) {
    const channel = message.channel;
    if (!channel.isSendable()) return;

    await channel.send(`**${message.author} ${result.newLevel}. seviyeye ulaştı! 🚀**`).catch(() => {});
  }
}
