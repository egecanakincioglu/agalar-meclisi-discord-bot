import type { ConfigDefinition } from "../types/Config.js";

export type SecretsConfig = {
  discord: {
    token: string;
    clientId: string;
    guildId: string;
  };
};

const defaultSecretsConfig: SecretsConfig = {
  discord: {
    token: "",
    clientId: "",
    guildId: "",
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

export const secretsConfig = {
  key: "secrets",
  fileName: "Secrets.yml",
  defaultValue: defaultSecretsConfig,

  normalize(raw) {
    const root = asObject(raw);
    const discord = asObject(root.discord);

    return {
      discord: {
        token: asString(discord.token, defaultSecretsConfig.discord.token),
        clientId: asString(
          discord.clientId,
          defaultSecretsConfig.discord.clientId,
        ),
        guildId: asString(
          discord.guildId,
          defaultSecretsConfig.discord.guildId,
        ),
      },
    };
  },
} satisfies ConfigDefinition<"secrets", SecretsConfig>;
