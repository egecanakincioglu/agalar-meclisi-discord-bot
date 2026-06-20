import { Events } from "discord.js";
import type { GuildMember, Invite } from "discord.js";
import type { BotEvent } from "../types/Event.js";
import { findUsedInvite } from "../handlers/InviteCacheHandler.js";
import { getInviteSummary, recordMemberJoin } from "../database/repositories/InviteRepository.js";
import { getGuildSettings } from "../database/repositories/GuildSettingsRepository.js";
import { sendWelcomeMessage } from "../features/WelcomeFeature.js";

const event: BotEvent = {
  name: Events.GuildMemberAdd,

  async execute(member: GuildMember) {
    let usedInvite: Invite | null = null;
    try {
      usedInvite = await findUsedInvite(member.guild);
    } catch {}

    const inviterId = usedInvite?.inviterId ?? null;
    const inviteCode = usedInvite?.code ?? null;

    const joinResult = recordMemberJoin(member.guild.id, member.id, inviterId, inviteCode);

    const settings = getGuildSettings(member.guild.id);
    if (settings.autoRoleEnabled && settings.autoRoleId) {
      try { await member.roles.add(settings.autoRoleId, "Otorol"); } catch {}
    }

    const inviterInvites = inviterId ? getInviteSummary(member.guild.id, inviterId).netInvites : 0;

    await sendWelcomeMessage({ member, inviterId, inviteCode, inviterInviteCount: inviterInvites });

    console.log(
      [member.user.tag, inviterId ?? "-", inviteCode ?? "-", inviterInvites, joinResult.skipped ? "skipped" : "ok"].join(" | "),
    );
  },
};

export default event;
