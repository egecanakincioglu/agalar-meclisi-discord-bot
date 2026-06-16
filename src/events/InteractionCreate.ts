import { Events } from "discord.js";
import type { Interaction } from "discord.js";
import type { BotEvent } from "../types/Event.js";
import { getCommand } from "../handlers/CommandHandler.js";
import { getComponent } from "../handlers/ComponentHandler.js";

const event: BotEvent = {
  name: Events.InteractionCreate,

  async execute(interaction: Interaction) {
    if (interaction.isChatInputCommand()) {
      const command = getCommand(interaction.commandName);
      if (!command) {
        await interaction.reply({ content: "Bu komut bulunamadı.", flags: 64 });
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`/${interaction.commandName} komut hatası:`, error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: "Komut çalıştırılırken bir hata oluştu.", flags: 64 });
        } else {
          await interaction.reply({ content: "Komut çalıştırılırken bir hata oluştu.", flags: 64 });
        }
      }
      return;
    }

    if (
      interaction.isButton() ||
      interaction.isStringSelectMenu() ||
      interaction.isRoleSelectMenu() ||
      interaction.isUserSelectMenu() ||
      interaction.isChannelSelectMenu() ||
      interaction.isMentionableSelectMenu()
    ) {
      const component = getComponent(interaction.customId);
      if (!component) return;

      try {
        await component.execute(interaction);
      } catch (error) {
        console.error(`${interaction.customId} component hatası:`, error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: "Bu panel işleminde bir hata oluştu.", flags: 64 });
        } else {
          await interaction.reply({ content: "Bu panel işleminde bir hata oluştu.", flags: 64 });
        }
      }
    }
  },
};

export default event;
