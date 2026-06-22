import type { ConfigDefinition } from "../types/Config.js";

export type SecretsConfig = {
  discord: {
    token: string;
    clientId: string;
    guildId: string;
  };
  minecraft: {
    enabled: boolean;
    token: string;
    clientId: string;
  };
};

const defaultSecretsConfig: SecretsConfig = {
  discord: {
    token: "",
    clientId: "",
    guildId: "",
  },
  minecraft: {
    enabled: false,
    token: "",
    clientId: "",
  },
};

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function asBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  if (typeof value === "number") return value === 1;
  return fallback;
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
    const minecraft = asObject(root.minecraft);

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
      minecraft: {
        enabled: asBoolean(
          minecraft.enabled,
          defaultSecretsConfig.minecraft.enabled,
        ),
        token: asString(
          minecraft.token,
          defaultSecretsConfig.minecraft.token,
        ),
        clientId: asString(
          minecraft.clientId,
          defaultSecretsConfig.minecraft.clientId,
        ),
      },
    };
  },
} satisfies ConfigDefinition<"secrets", SecretsConfig>;
