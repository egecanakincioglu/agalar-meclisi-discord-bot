import { Events } from "discord.js";
import type { GuildMember } from "discord.js";
import type { BotEvent } from "../types/Event.js";
import { recordMemberLeave } from "../database/repositories/InviteRepository.js";
import { sendLeaveMessage } from "../features/LeaveFeature.js";

const event: BotEvent = {
  name: Events.GuildMemberRemove,

  async execute(member: GuildMember) {
    const result = recordMemberLeave(member.guild.id, member.id);
    await sendLeaveMessage(member, result.inviterId);
    console.log(`${member.user.tag} ayrıldı | inviter: ${result.inviterId ?? "-"} | ${result.updated ? "updated" : "skipped"}`);
  },
};

export default event;
