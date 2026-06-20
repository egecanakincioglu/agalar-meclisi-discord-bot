import { eq, and, desc } from "drizzle-orm";
import { db } from "../Client.js";
import { levelSettings, memberLevels } from "../Schema.js";

export type LevelSettings = {
  guildId: string;
  enabled: boolean;
};

function toBoolean(value: number): boolean {
  return value === 1;
}

function toInteger(value: boolean): number {
  return value ? 1 : 0;
}

function now(): string {
  return new Date().toISOString();
}

function ensureLevelSettings(guildId: string): void {
  db.insert(levelSettings)
    .values({ guildId, enabled: 0, createdAt: now(), updatedAt: now() })
    .onConflictDoNothing()
    .run();
}

export function getLevelSettings(guildId: string): LevelSettings {
  ensureLevelSettings(guildId);

  const row = db
    .select()
    .from(levelSettings)
    .where(eq(levelSettings.guildId, guildId))
    .get();

  return {
    guildId: row?.guildId ?? guildId,
    enabled: row ? toBoolean(row.enabled) : false,
  };
}

export function updateLevelSettings(
  guildId: string,
  patch: { enabled?: boolean },
): LevelSettings {
  ensureLevelSettings(guildId);

  const data: Record<string, unknown> = { updatedAt: now() };
  if (patch.enabled !== undefined) data.enabled = toInteger(patch.enabled);

  db.update(levelSettings)
    .set(data)
    .where(eq(levelSettings.guildId, guildId))
    .run();

  return getLevelSettings(guildId);
}

export type MemberLevel = {
  guildId: string;
  userId: string;
  xp: number;
  level: number;
  lastMessageAt: string | null;
};

export function xpForNextLevel(level: number): number {
  return 200 * level;
}

function ensureMemberLevel(guildId: string, userId: string): void {
  db.insert(memberLevels)
    .values({ guildId, userId, xp: 0, level: 1, lastMessageAt: null })
    .onConflictDoNothing()
    .run();
}

export function getMemberLevel(guildId: string, userId: string): MemberLevel {
  ensureMemberLevel(guildId, userId);

  const row = db
    .select()
    .from(memberLevels)
    .where(and(eq(memberLevels.guildId, guildId), eq(memberLevels.userId, userId)))
    .get();

  return {
    guildId: row?.guildId ?? guildId,
    userId: row?.userId ?? userId,
    xp: row?.xp ?? 0,
    level: row?.level ?? 1,
    lastMessageAt: row?.lastMessageAt ?? null,
  };
}

export function addXp(
  guildId: string,
  userId: string,
  amount: number,
): { newLevel: number; newXp: number; leveledUp: boolean } {
  ensureMemberLevel(guildId, userId);

  const current = getMemberLevel(guildId, userId);

  let totalXp = current.xp + amount;
  let level = current.level;
  let leveledUp = false;

  while (totalXp >= xpForNextLevel(level)) {
    totalXp -= xpForNextLevel(level);
    level++;
    leveledUp = true;
  }

  db.update(memberLevels)
    .set({ xp: totalXp, level, lastMessageAt: now() })
    .where(and(eq(memberLevels.guildId, guildId), eq(memberLevels.userId, userId)))
    .run();

  return { newLevel: level, newXp: totalXp, leveledUp };
}

export function getLevelLeaderboard(guildId: string, limit = 10): MemberLevel[] {
  const rows = db
    .select()
    .from(memberLevels)
    .where(eq(memberLevels.guildId, guildId))
    .orderBy(desc(memberLevels.level), desc(memberLevels.xp))
    .limit(limit)
    .all();

  return rows.map(row => ({
    guildId: row.guildId,
    userId: row.userId,
    xp: row.xp,
    level: row.level,
    lastMessageAt: row.lastMessageAt,
  }));
}

export function getLevelRank(guildId: string, userId: string): number {
  const current = getMemberLevel(guildId, userId);

  const higherCount = db
    .select()
    .from(memberLevels)
    .where(eq(memberLevels.guildId, guildId))
    .all()
    .filter(
      row =>
        row.level > current.level ||
        (row.level === current.level && row.xp > current.xp),
    ).length;

  return higherCount + 1;
}
