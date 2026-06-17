import { Events, Guild } from "discord.js";
import type { Invite } from "discord.js";
import type { BotEvent } from "../types/Event.js";
import { cacheGuildInvites } from "../handlers/InviteCacheHandler.js";

const event: BotEvent = {
  name: Events.InviteCreate,

  async execute(invite: Invite) {
    if (!invite.guild || !(invite.guild instanceof Guild)) return;
    await cacheGuildInvites(invite.guild);
  },
};

export default event;
