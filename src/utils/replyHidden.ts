import type {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  ChatInputCommandInteraction,
  RoleSelectMenuInteraction,
} from "discord.js";

type ReplyInteraction =
  | ChatInputCommandInteraction
  | ButtonInteraction
  | ChannelSelectMenuInteraction
  | RoleSelectMenuInteraction;

export async function replyHidden(
  interaction: ReplyInteraction,
  content: string,
): Promise<void> {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content, flags: 64 });
  } else {
    await interaction.reply({ content, flags: 64 });
  }
}
