import { Events } from "discord.js";
import type { Invite } from "discord.js";
import type { BotEvent } from "../types/Event.js";
import { addInviteToCache } from "../handlers/InviteCacheHandler.js";

const event: BotEvent = {
  name: Events.InviteCreate,

  async execute(invite: Invite) {
    if (!invite.guild) return;
    addInviteToCache(invite.guild.id, invite.code);
  },
};

export default event;
