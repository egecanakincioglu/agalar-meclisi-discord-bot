import { Collection } from "discord.js";
import type { Client, Guild, Invite } from "discord.js";

const inviteCache = new Collection<string, Collection<string, Invite>>();

export async function cacheAllGuildInvites(client: Client) {
  for (const guild of client.guilds.cache.values()) {
    try {
      const invites = await guild.invites.fetch();
      inviteCache.set(guild.id, invites);
    } catch {
      inviteCache.set(guild.id, new Collection());
    }
  }

  console.log("agalar meclisi invite cache hazır.");
}

export async function cacheGuildInvites(guild: Guild) {
  try {
    const invites = await guild.invites.fetch();
    inviteCache.set(guild.id, invites);
  } catch {
    inviteCache.set(guild.id, new Collection());
  }
}

export function getCachedInvites(guildId: string): Collection<string, Invite> {
  return inviteCache.get(guildId) ?? new Collection();
}

export async function findUsedInvite(guild: Guild): Promise<Invite | null> {
  const cached = inviteCache.get(guild.id);
  if (!cached) return null;

  try {
    const current = await guild.invites.fetch();

    for (const [code, invite] of current) {
      const cachedInv = cached.get(code);
      if (cachedInv && (invite.uses ?? 0) > (cachedInv.uses ?? 0)) {
        inviteCache.set(guild.id, current);
        return invite;
      }
    }

    inviteCache.set(guild.id, current);
    return null;
  } catch {
    return null;
  }
}
