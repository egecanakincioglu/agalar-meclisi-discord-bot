import { Events } from "discord.js";
import type { Client } from "discord.js";
import type { BotEvent } from "../types/Event.js";
import { cacheAllGuildInvites } from "../handlers/InviteCacheHandler.js";
import { startPresenceRotation } from "../handlers/PresenceHandler.js";
import { autoJoinVoiceChannels } from "../handlers/VoiceAutoJoinHandler.js";

const event: BotEvent = {
  name: Events.ClientReady,
  once: true,

  async execute(client: Client) {
    console.log(`${client.user?.tag} aktif.`);
    await cacheAllGuildInvites(client);
    await startPresenceRotation(client);
    await autoJoinVoiceChannels(client);
  },
};

export default event;
