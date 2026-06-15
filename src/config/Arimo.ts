import { secretsConfig } from "./SecretsConfig.js";
import { botConfig } from "./BotConfig.js";
import { presenceConfig } from "./PresenceConfig.js";

import type { ConfigObject } from "../types/Config.js";

export const configDefinitions = [
  secretsConfig,
  botConfig,
  presenceConfig,
] as const;

export type AppConfig = ConfigObject<typeof configDefinitions>;
