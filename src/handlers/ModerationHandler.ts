import { PermissionsBitField } from "discord.js";
import type { ChatInputCommandInteraction, GuildMember } from "discord.js";

async function replyHidden(
  interaction: ChatInputCommandInteraction,
  content: string,
) {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content, flags: 64 });
  } else {
    await interaction.reply({ content, flags: 64 });
  }
}

export async function isAdmin(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild() || !interaction.guild) {
    await replyHidden(interaction, "Bu komut sadece sunucuda kullanılabilir.");
    return false;
  }

  const executorMember = await interaction.guild.members
    .fetch(interaction.user.id)
    .catch(() => null);

  if (!executorMember) {
    await replyHidden(interaction, "Komutu kullanan üye bilgisi alınamadı.");
    return false;
  }

  const hasAdmin = executorMember.permissions.has(
    PermissionsBitField.Flags.Administrator,
  );

  if (!hasAdmin) {
    await replyHidden(interaction, "Bu komutu kullanmak için yönetici yetkisine sahip olmalısın.");
    return false;
  }

  return true;
}

export async function canModerateTarget(
  interaction: ChatInputCommandInteraction,
  targetMember: GuildMember,
  action: "kick" | "ban",
) {
  if (!interaction.guild) {
    await replyHidden(interaction, "Sunucu bilgisi alınamadı.");
    return false;
  }

  const executorMember = await interaction.guild.members
    .fetch(interaction.user.id)
    .catch(() => null);

  if (!executorMember) {
    await replyHidden(interaction, "Komutu kullanan üye bilgisi alınamadı.");
    return false;
  }

  if (targetMember.id === interaction.user.id) {
    await replyHidden(interaction, action === "kick" ? "Kendini kickleyemezsin." : "Kendini banlayamazsın.");
    return false;
  }

  if (targetMember.id === interaction.client.user.id) {
    await replyHidden(interaction, action === "kick" ? "Beni kickleyemezsin." : "Beni banlayamazsın.");
    return false;
  }

  if (targetMember.id === interaction.guild.ownerId) {
    await replyHidden(interaction, "Sunucu sahibine işlem yapamazsın.");
    return false;
  }

  const executorIsOwner = executorMember.id === interaction.guild.ownerId;

  if (!executorIsOwner) {
    const executorRolePosition = executorMember.roles.highest.position;
    const targetRolePosition = targetMember.roles.highest.position;

    if (targetRolePosition >= executorRolePosition) {
      await replyHidden(interaction, "Bu kullanıcı seninle aynı rolde veya senden daha üstte.");
      return false;
    }
  }

  if (action === "kick" && !targetMember.kickable) {
    await replyHidden(interaction, "Bu kullanıcıyı atamıyorum.");
    return false;
  }

  if (action === "ban" && !targetMember.bannable) {
    await replyHidden(interaction, "Bu kullanıcıyı banlayamıyorum.");
    return false;
  }

  return true;
}
