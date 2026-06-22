import { Events } from "discord.js";
import type { Invite } from "discord.js";
import type { BotEvent } from "../types/Event.js";
import { removeInviteFromCache } from "../handlers/InviteCacheHandler.js";

const event: BotEvent = {
  name: Events.InviteDelete,

  async execute(invite: Invite) {
    if (!invite.guild) return;
    removeInviteFromCache(invite.guild.id, invite.code);
  },
};

export default event;
