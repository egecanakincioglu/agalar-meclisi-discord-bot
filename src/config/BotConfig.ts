import type { ConfigDefinition } from "../types/Config.js";

export type BotConfig = {
  info: {
    name: string;
    language: string;
    timezone: string;
  };

  commands: {
    autoDeploy: boolean;
    guildOnly: boolean;
  };

  developer: {
    debug: boolean;
    developerIds: string[];
  };
};

const defaultBotConfig: BotConfig = {
  info: {
    name: "Agalar Meclisi",
    language: "tr",
    timezone: "Europe/Skopje",
  },

  commands: {
    autoDeploy: true,
    guildOnly: true,
  },

  developer: {
    debug: true,
    developerIds: [] as string[],
  },
};

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return fallback;
}

export const botConfig = {
  key: "bot",
  fileName: "Bot.yml",
  defaultValue: defaultBotConfig,

  normalize(raw) {
    const root = asObject(raw);

    const info = asObject(root.info);
    const commands = asObject(root.commands);
    const developer = asObject(root.developer);

    return {
      info: {
        name: asString(info.name, defaultBotConfig.info.name),
        language: asString(info.language, defaultBotConfig.info.language),
        timezone: asString(info.timezone, defaultBotConfig.info.timezone),
      },

      commands: {
        autoDeploy: asBoolean(
          commands.autoDeploy,
          defaultBotConfig.commands.autoDeploy,
        ),
        guildOnly: asBoolean(
          commands.guildOnly,
          defaultBotConfig.commands.guildOnly,
        ),
      },

      developer: {
        debug: asBoolean(developer.debug, defaultBotConfig.developer.debug),
        developerIds: asStringArray(
          developer.developerIds,
          defaultBotConfig.developer.developerIds,
        ),
      },
    };
  },
} satisfies ConfigDefinition<"bot", BotConfig>;
