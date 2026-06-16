import { Events } from "discord.js";
import type { Message } from "discord.js";
import type { BotEvent } from "../types/Event.js";
import { handleMessageXp } from "../features/LevelFeature.js";

const event: BotEvent = {
  name: Events.MessageCreate,

  async execute(message: Message) {
    try {
      await handleMessageXp(message);
    } catch (error) {
      console.error("[Level] XP işleme hatası:", error);
    }
  },
};

export default event;
