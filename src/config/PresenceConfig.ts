import type { ConfigDefinition } from "../types/Config.js";

export type PresenceConfig = {
  enabled: boolean;
  status: string;
  activityType: string;
  intervalSeconds: number;
  streamUrl?: string;
  messages: string[];
};

const defaultPresenceConfig: PresenceConfig = {
  enabled: true,
  status: "dnd",
  activityType: "watching",
  intervalSeconds: 8,
  streamUrl: "https://www.twitch.tv/example",
  messages: [
    "Agalar Meclisi",
    "{members} üye bizi izliyor",
    "{servers} sunucuda aktif",
    "/invites ile davetlerini kontrol et",
  ],
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

function asOptionalString(value: unknown, fallback?: string) {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function asStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;

  const values = value.filter(item => {
    return typeof item === "string" && item.trim().length > 0;
  });

  return values.length > 0 ? values : fallback;
}

export const presenceConfig = {
  key: "presence",
  fileName: "Presence.yml",
  defaultValue: defaultPresenceConfig,

  normalize(raw) {
    const root = asObject(raw);

    return {
      enabled: asBoolean(root.enabled, defaultPresenceConfig.enabled),
      status: asString(root.status, defaultPresenceConfig.status),
      activityType: asString(
        root.activityType,
        defaultPresenceConfig.activityType,
      ),
      intervalSeconds: Math.max(
        asNumber(root.intervalSeconds, defaultPresenceConfig.intervalSeconds),
        8,
      ),
      streamUrl: asOptionalString(
        root.streamUrl,
        defaultPresenceConfig.streamUrl,
      ),
      messages: asStringArray(root.messages, defaultPresenceConfig.messages),
    };
  },
} satisfies ConfigDefinition<"presence", PresenceConfig>;
