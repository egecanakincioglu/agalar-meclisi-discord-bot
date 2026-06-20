import { watch } from "node:fs";
import type { FSWatcher } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse, stringify } from "yaml";
import { configDefinitions } from "../config/Arimo.js";
import type { AppConfig } from "../config/Arimo.js";
import type { AnyConfigDefinition } from "../types/Config.js";

const CONFIG_DIR = path.join(process.cwd(), "config");

let config = buildDefaultConfig();

let watcherStarted = false;
let reloadTimer: ReturnType<typeof setTimeout> | null = null;
let configWatcher: FSWatcher | null = null;

const reloadListeners: Array<
  (config: AppConfig) => void | Promise<void>
> = [];

function buildDefaultConfig(): AppConfig {
  const defaults: Record<string, unknown> = {};

  for (const definition of configDefinitions) {
    defaults[definition.key] = definition.defaultValue;
  }

  return defaults as AppConfig;
}

function validateConfigDefinitions() {
  const keys = new Set<string>();
  const files = new Set<string>();

  for (const definition of configDefinitions) {
    if (keys.has(definition.key)) {
      throw new Error(`Tekrarlanan config key: ${definition.key}`);
    }
    keys.add(definition.key);

    const fileName = definition.fileName.toLowerCase();
    if (files.has(fileName)) {
      throw new Error(`Tekrarlanan config dosyası: ${definition.fileName}`);
    }
    files.add(fileName);
  }
}

async function readYamlFile(definition: AnyConfigDefinition) {
  const filePath = path.join(CONFIG_DIR, definition.fileName);

  try {
    const raw = await readFile(filePath, "utf8");
    return parse(raw) ?? {};
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === "ENOENT") {
      await writeFile(filePath, stringify(definition.defaultValue), "utf8");
      console.log(`Config oluşturuldu: ${definition.fileName}`);
      return definition.defaultValue;
    }

    throw error;
  }
}

async function reloadConfigFromDisk() {
  try {
    await mkdir(CONFIG_DIR, { recursive: true });

    const nextConfig: Record<string, unknown> = {};

    for (const definition of configDefinitions) {
      const raw = await readYamlFile(definition);
      nextConfig[definition.key] = definition.normalize(raw);
    }

    config = nextConfig as AppConfig;
    console.log("Live YAML config yenilendi.");

    for (const listener of reloadListeners) {
      await listener(config);
    }
  } catch (error) {
    console.error("Config okunamadı:", error);
  }
}

function scheduleReload() {
  if (reloadTimer) clearTimeout(reloadTimer);
  reloadTimer = setTimeout(async () => { await reloadConfigFromDisk(); }, 300);
}

export async function startLiveConfig() {
  validateConfigDefinitions();
  await reloadConfigFromDisk();

  if (watcherStarted) return;
  watcherStarted = true;

  const watchedFiles = new Set(
    configDefinitions.map(d => d.fileName.toLowerCase()),
  );

  configWatcher = watch(CONFIG_DIR, (_eventType, filename) => {
    if (!filename) return;
    const fileName = filename.toString().toLowerCase();
    if (!fileName.endsWith(".yml") && !fileName.endsWith(".yaml")) return;
    if (!watchedFiles.has(fileName)) return;
    scheduleReload();
  });

  console.log("Live YAML config sistemi aktif.");
}

export function getConfig() {
  return config;
}

export function onConfigReload(listener: (config: AppConfig) => void | Promise<void>) {
  reloadListeners.push(listener);
  return () => {
    const index = reloadListeners.indexOf(listener);
    if (index !== -1) reloadListeners.splice(index, 1);
  };
}

export async function reloadConfig() {
  await reloadConfigFromDisk();
}

export function stopLiveConfig() {
  if (reloadTimer) { clearTimeout(reloadTimer); reloadTimer = null; }
  if (configWatcher) { configWatcher.close(); configWatcher = null; }
  watcherStarted = false;
}
