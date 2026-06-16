import type { Client } from "discord.js";
import type { BotEvent } from "../types/Event.js";

export function loadEvents(client: Client, events: BotEvent[]) {
  for (const event of events) {
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`Event yüklendi: ${event.name}`);
  }
}
