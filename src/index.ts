import { Client, GatewayIntentBits } from "discord.js";
import { loadCommands } from "./handlers/CommandHandler.js";
import { loadComponents } from "./handlers/ComponentHandler.js";
import { loadEvents } from "./handlers/EventHandler.js";
import { deployCommands } from "./handlers/DeployCommandsHandler.js";
import { getConfig, startLiveConfig, stopLiveConfig } from "./handlers/ConfigHandler.js";
import { initializeDatabase } from "./database/Init.js";
import { stopPresenceRotation } from "./handlers/PresenceHandler.js";
import { commands } from "./commands/Arimo.js";
import { components } from "./components/Arimo.js";
import { events } from "./events/Arimo.js";

async function main() {
  await startLiveConfig();

  const config = getConfig();
  const token = config.secrets.discord.token;

  if (!token) {
    throw new Error("Discord token config/Secrets.yml içinde bulunamadı.");
  }

  initializeDatabase();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildInvites,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  if (config.bot.commands.autoDeploy) {
    await deployCommands(commands);
  }

  loadCommands(commands);
  loadComponents(components);
  loadEvents(client, events);

  process.on("SIGINT", () => {
    console.log("Bot kapatılıyor...");
    stopLiveConfig();
    stopPresenceRotation();
    client.destroy();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("Bot kapatılıyor...");
    stopLiveConfig();
    stopPresenceRotation();
    client.destroy();
    process.exit(0);
  });

  await client.login(token);
}

main().catch(error => {
  console.error("Bot başlatılırken kritik hata oluştu:", error);
  process.exit(1);
});
