import "dotenv/config";
import { REST, Routes } from "discord.js";
import type { Command } from "../types/Command.js";
import { getConfig } from "./ConfigHandler.js";

export async function deployCommands(commands: Command[]) {
  const config = getConfig();

  const token = config.secrets.discord.token || process.env.DISCORD_TOKEN;
  const clientId = config.secrets.discord.clientId || process.env.CLIENT_ID;
  const guildId = config.secrets.discord.guildId || process.env.GUILD_ID;

  if (!token || !clientId || !guildId) {
    throw new Error("Discord deploy config is missing.");
  }

  const rest = new REST({ version: "10" }).setToken(token);
  const body = commands.map(command => command.data.toJSON());

  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
  console.log("Slash commands deployed.");
}
