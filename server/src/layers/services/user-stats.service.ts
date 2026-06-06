import type { PrismaClient } from '@prisma/client';

export interface StreakInfo {
  current: number;
  longest: number;
  /** ISO date (YYYY-MM-DD) of the last day the user wrote anything. */
  lastWriteDay: string | null;
}

export interface UserStats {
  totals: {
    universes: number;
    writings: number;
    words: number;
    characters: number;
    locations: number;
    immutableLaws: number;
  };
  writingActivity: {
    today: number;
    last7Days: number;
    last30Days: number;
  };
  streak: StreakInfo;
  ai: {
    callsLast24h: number;
    callsTotal: number;
  };
}

/**
 * Aggregates per-user platform statistics for the dashboard. Heavy on counts,
 * never on raw payloads — the dashboard never needs full rows here.
 */
export class UserStatsService {
  constructor(private readonly prisma: PrismaClient) {}

  async build(userId: string): Promise<UserStats> {
    const now = new Date();
    const todayStart = startOfDay(now);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 3600 * 1000);

    const [
      universesCount,
      writingAggregate,
      charactersCount,
      locationsCount,
      lawsCount,
      writingsToday,
      writingsLast7,
      writingsLast30,
      aiLast24h,
      aiTotal,
      writingUpdates,
    ] = await Promise.all([
      this.prisma.universe.count({ where: { userId } }),
      this.prisma.writing.aggregate({
        where: { userId },
        _sum: { wordCount: true },
        _count: { id: true },
      }),
      this.prisma.character.count({ where: { universe: { userId } } }),
      this.prisma.location.count({ where: { universe: { userId } } }),
      this.prisma.immutableLaw.count({ where: { universe: { userId } } }),
      this.prisma.writing.aggregate({
        where: { userId, updatedAt: { gte: todayStart } },
        _sum: { wordCount: true },
      }),
      this.prisma.writing.aggregate({
        where: { userId, updatedAt: { gte: sevenDaysAgo } },
        _sum: { wordCount: true },
      }),
      this.prisma.writing.aggregate({
        where: { userId, updatedAt: { gte: thirtyDaysAgo } },
        _sum: { wordCount: true },
      }),
      this.prisma.aIUsageLog.count({ where: { userId, createdAt: { gte: oneDayAgo } } }),
      this.prisma.aIUsageLog.count({ where: { userId } }),
      this.prisma.writing.findMany({
        where: { userId },
        select: { updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 200,
      }),
    ]);

    const streak = computeStreak(writingUpdates.map((w) => w.updatedAt));

    return {
      totals: {
        universes: universesCount,
        writings: writingAggregate._count.id,
        words: writingAggregate._sum.wordCount ?? 0,
        characters: charactersCount,
        locations: locationsCount,
        immutableLaws: lawsCount,
      },
      writingActivity: {
        today: writingsToday._sum.wordCount ?? 0,
        last7Days: writingsLast7._sum.wordCount ?? 0,
        last30Days: writingsLast30._sum.wordCount ?? 0,
      },
      streak,
      ai: {
        callsLast24h: aiLast24h,
        callsTotal: aiTotal,
      },
    };
  }
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIsoDay(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

/**
 * Computes consecutive-day write streaks. A user with edits today and yesterday
 * has a current streak of 2. Streak resets the first time a day is skipped.
 */
function computeStreak(updates: Date[]): StreakInfo {
  if (updates.length === 0) {
    return { current: 0, longest: 0, lastWriteDay: null };
  }

  const dayKeys = Array.from(new Set(updates.map(toIsoDay))).sort().reverse();
  const lastWriteDay = dayKeys[0] ?? null;

  // Build current streak from today backwards.
  let current = 0;
  const today = toIsoDay(new Date());
  const yesterday = toIsoDay(new Date(Date.now() - 24 * 3600 * 1000));
  const dayKeySet = new Set(dayKeys);

  if (dayKeySet.has(today) || dayKeySet.has(yesterday)) {
    let cursor = dayKeySet.has(today) ? new Date() : new Date(Date.now() - 24 * 3600 * 1000);
    while (dayKeySet.has(toIsoDay(cursor))) {
      current += 1;
      cursor = new Date(cursor.getTime() - 24 * 3600 * 1000);
    }
  }

  // Longest streak across the dataset.
  let longest = 0;
  let run = 0;
  let prevKey: string | null = null;
  const ascendingKeys = [...dayKeys].sort();
  for (const key of ascendingKeys) {
    if (prevKey === null) {
      run = 1;
    } else {
      const prevDate = new Date(`${prevKey}T00:00:00`);
      const currDate = new Date(`${key}T00:00:00`);
      const diff = Math.round((currDate.getTime() - prevDate.getTime()) / (24 * 3600 * 1000));
      run = diff === 1 ? run + 1 : 1;
    }
    if (run > longest) longest = run;
    prevKey = key;
  }

  return { current, longest, lastWriteDay };
}
