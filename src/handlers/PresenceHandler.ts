import type { Client } from "discord.js";
import { ActivityType } from "discord.js";
import { getConfig } from "./ConfigHandler.js";

let interval: ReturnType<typeof setInterval> | null = null;

export async function startPresenceRotation(client: Client) {
  const config = getConfig();
  const presence = config.presence;

  if (!presence.enabled) return;

  let index = 0;

  const rotate = async () => {
    const messages = presence.messages;
    if (messages.length === 0) return;

    const message = messages[index % messages.length]
      .replace("{members}", client.guilds.cache.reduce((s, g) => s + g.memberCount, 0).toString())
      .replace("{servers}", client.guilds.cache.size.toString());

    const type = (() => {
      switch (presence.activityType) {
        case "playing": return ActivityType.Playing;
        case "listening": return ActivityType.Listening;
        case "competing": return ActivityType.Competing;
        default: return ActivityType.Watching;
      }
    })();

    client.user?.setPresence({
      activities: [{ name: message, type }],
      status: presence.status as "online" | "idle" | "dnd" | "invisible",
    });

    console.log(`Presence changed: ${message}`);
    index++;
  };

  await rotate();
  interval = setInterval(rotate, presence.intervalSeconds * 1000);
  console.log(`Presence system started. Interval: ${presence.intervalSeconds}s.`);
}

export function stopPresenceRotation() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}
