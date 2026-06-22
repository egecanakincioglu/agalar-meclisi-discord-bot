import { Collection } from "discord.js";
import type { Client, Guild, Invite } from "discord.js";

// guildId -> Map<inviteCode, usesCount>
const inviteCache = new Collection<string, Collection<string, number>>();

export async function cacheAllGuildInvites(client: Client) {
  for (const guild of client.guilds.cache.values()) {
    try {
      const invites = await guild.invites.fetch();
      const map = new Collection<string, number>();
      for (const [code, invite] of invites) {
        map.set(code, invite.uses ?? 0);
      }
      inviteCache.set(guild.id, map);
      console.log(`[Invite] ${guild.name}: ${map.size} davet cache'lendi`);
    } catch (err) {
      console.error(`[Invite] ${guild.name} cache başarısız (MANAGE_GUILD?):`, (err as Error).message ?? err);
    }
  }
  console.log("agalar meclisi invite cache hazır.");
}

export function addInviteToCache(guildId: string, code: string) {
  const map = inviteCache.get(guildId);
  if (!map) return;
  map.set(code, 0);
  console.log(`[Invite] Cache eklendi: ${code}`);
}

export function removeInviteFromCache(guildId: string, code: string) {
  const map = inviteCache.get(guildId);
  if (!map) return;
  map.delete(code);
  console.log(`[Invite] Cache silindi: ${code}`);
}

export async function findUsedInvite(guild: Guild): Promise<Invite | null> {
  try {
    const current = await guild.invites.fetch();
    const cached = inviteCache.get(guild.id);

    if (!cached || cached.size === 0) {
      const map = new Collection<string, number>();
      for (const [code, invite] of current) {
        map.set(code, invite.uses ?? 0);
      }
      inviteCache.set(guild.id, map);
      console.log(`[Invite] ${guild.name}: ilk cache (${map.size} davet)`);
      return null;
    }

    const used = current.find(invite => {
      const cur = invite.uses ?? 0;
      const old = cached.get(invite.code) ?? 0;
      return cur > old;
    });

    // Cache'i güncelle
    for (const [code, invite] of current) {
      cached.set(code, invite.uses ?? 0);
    }

    if (used) {
      console.log(`[Invite] Eşleşti: ${used.code} (${cached.get(used.code)} uses, inviter: ${used.inviter?.tag})`);
    } else {
      console.log(`[Invite] ${guild.name}: eşleşme yok (cache: ${cached.size}, güncel: ${current.size})`);
    }

    return used ?? null;
  } catch (err) {
    console.error("[Invite] findUsedInvite başarısız:", (err as Error).message ?? err);
    return null;
  }
}
