import { eq, and, sql } from "drizzle-orm";
import { db } from "../Client.js";
import { memberInvites, inviteStats } from "../Schema.js";

function now(): string {
  return new Date().toISOString();
}

export function recordMemberJoin(
  guildId: string,
  memberId: string,
  inviterId: string | null,
  inviteCode: string | null,
): { skipped: boolean; reason?: string } {
  const existing = db
    .select()
    .from(memberInvites)
    .where(
      and(
        eq(memberInvites.guildId, guildId),
        eq(memberInvites.memberId, memberId),
        eq(memberInvites.isActive, 1),
      ),
    )
    .get();

  if (existing) {
    // Eski kayıtta inviter yok ama şimdi varsa — güncelle ve sayacı arttır
    if (!existing.inviterId && inviterId) {
      db.update(memberInvites)
        .set({ inviterId, inviteCode })
        .where(eq(memberInvites.id, existing.id))
        .run();

      ensureInviteStats(guildId, inviterId);
      db.update(inviteStats)
        .set({
          totalInvites: sql`total_invites + 1`,
          activeInvites: sql`active_invites + 1`,
          updatedAt: now(),
        })
        .where(
          and(
            eq(inviteStats.guildId, guildId),
            eq(inviteStats.userId, inviterId),
          ),
        )
        .run();

      return { skipped: false, reason: "backfilled_inviter" };
    }
    return { skipped: true, reason: "duplicate_active" };
  }

  db.insert(memberInvites)
    .values({
      guildId,
      memberId,
      inviterId,
      inviteCode,
      joinedAt: now(),
      isActive: 1,
    })
    .run();

  if (inviterId) {
    ensureInviteStats(guildId, inviterId);
    db.update(inviteStats)
      .set({
        totalInvites: sql`total_invites + 1`,
        activeInvites: sql`active_invites + 1`,
        updatedAt: now(),
      })
      .where(
        and(
          eq(inviteStats.guildId, guildId),
          eq(inviteStats.userId, inviterId),
        ),
      )
      .run();
  }

  return { skipped: false };
}

export function recordMemberLeave(
  guildId: string,
  memberId: string,
): { updated: boolean; inviterId: string | null } {
  const row = db
    .select()
    .from(memberInvites)
    .where(
      and(
        eq(memberInvites.guildId, guildId),
        eq(memberInvites.memberId, memberId),
        eq(memberInvites.isActive, 1),
      ),
    )
    .get();

  if (!row) return { updated: false, inviterId: null };

  db.update(memberInvites)
    .set({ isActive: 0, leftAt: now() })
    .where(eq(memberInvites.id, row.id))
    .run();

  if (row.inviterId) {
    db.update(inviteStats)
      .set({
        activeInvites: sql`MAX(active_invites - 1, 0)`,
        leftInvites: sql`left_invites + 1`,
        updatedAt: now(),
      })
      .where(
        and(
          eq(inviteStats.guildId, guildId),
          eq(inviteStats.userId, row.inviterId),
        ),
      )
      .run();
  }

  return { updated: true, inviterId: row.inviterId };
}

function ensureInviteStats(guildId: string, userId: string): void {
  db.insert(inviteStats)
    .values({
      guildId,
      userId,
      totalInvites: 0,
      activeInvites: 0,
      leftInvites: 0,
      bonusInvites: 0,
      fakeInvites: 0,
      createdAt: now(),
      updatedAt: now(),
    })
    .onConflictDoNothing()
    .run();
}

export function getInviteSummary(guildId: string, userId: string) {
  ensureInviteStats(guildId, userId);

  const row = db
    .select()
    .from(inviteStats)
    .where(
      and(
        eq(inviteStats.guildId, guildId),
        eq(inviteStats.userId, userId),
      ),
    )
    .get();

  if (!row) {
    return {
      totalInvites: 0,
      activeInvites: 0,
      leftInvites: 0,
      bonusInvites: 0,
      fakeInvites: 0,
      netInvites: 0,
    };
  }

  return {
    totalInvites: row.totalInvites,
    activeInvites: row.activeInvites,
    leftInvites: row.leftInvites,
    bonusInvites: row.bonusInvites,
    fakeInvites: row.fakeInvites,
    netInvites: row.totalInvites - row.leftInvites - row.fakeInvites + row.bonusInvites,
  };
}

export function getInviteLeaderboard(guildId: string, limit = 10) {
  const rows = db
    .select()
    .from(inviteStats)
    .where(eq(inviteStats.guildId, guildId))
    .all();

  return rows
    .map(row => ({
      userId: row.userId,
      totalInvites: row.totalInvites,
      activeInvites: row.activeInvites,
      leftInvites: row.leftInvites,
      bonusInvites: row.bonusInvites,
      fakeInvites: row.fakeInvites,
      netInvites:
        row.totalInvites - row.leftInvites - row.fakeInvites + row.bonusInvites,
    }))
    .sort((a, b) => b.netInvites - a.netInvites)
    .slice(0, limit);
}
