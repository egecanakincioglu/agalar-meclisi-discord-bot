import { Collection } from "discord.js";
import type { Command } from "../types/Command.js";

const commandCollection = new Collection<string, Command>();

export function loadCommands(commands: Command[]) {
  for (const command of commands) {
    commandCollection.set(command.data.name, command);
    console.log(`Komut yüklendi: /${command.data.name}`);
  }
}

export function getCommand(name: string) {
  return commandCollection.get(name);
}
