import readyEvent from "./Ready.js";
import guildMemberAddEvent from "./GuildMemberAdd.js";
import guildMemberRemoveEvent from "./GuildMemberRemove.js";
import interactionCreateEvent from "./InteractionCreate.js";
import inviteCreateEvent from "./InviteCreate.js";
import inviteDeleteEvent from "./InviteDelete.js";
import messageCreateEvent from "./MessageCreate.js";

export const events = [
  readyEvent,
  guildMemberAddEvent,
  guildMemberRemoveEvent,
  interactionCreateEvent,
  inviteCreateEvent,
  inviteDeleteEvent,
  messageCreateEvent,
];
