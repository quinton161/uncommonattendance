import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import type { MonthlyAwardDoc, MonthlyAwardWinner } from '../types/notifications';
import { resolvedHubLabel } from './hubService';
import { attendanceAnalyticsService, type DateRange } from './attendanceAnalyticsService';

export function monthlyAwardDocId(period: string, hubId: string): string {
  return `${period}_${hubId}`;
}

export function periodFromRange(range: DateRange): string {
  return range.startDate.slice(0, 7);
}

export async function getMonthlyAward(
  period: string,
  hubId: string
): Promise<MonthlyAwardDoc | null> {
  try {
    const result = await convex.query(api.monthlyAwards.get as any, { period, hubId }) as any;
    if (!result) return null;
    return {
      period: result.period,
      hubId: result.hubId,
      hubName: result.hubName,
      winners: result.winners as MonthlyAwardWinner[],
      computedAt: new Date(result.computedAt),
    };
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[monthlyAwardsService] getMonthlyAward failed', e);
    }
    return null;
  }
}

export async function computeAndSaveMonthlyAwards(
  range: DateRange,
  hubId: string,
  hubName?: string
): Promise<MonthlyAwardDoc> {
  const period = periodFromRange(range);
  const leaders = await attendanceAnalyticsService.getMonthlyStudentLeaders(hubId, range, 3);
  const winners: MonthlyAwardWinner[] = leaders.map((l) => ({
    rank: l.rank,
    studentId: l.studentId,
    studentName: l.studentName,
    attendanceRate: l.attendanceRate,
    present: l.present,
    late: l.late,
    streak: l.streak,
  }));

  await convex.mutation(api.monthlyAwards.save as any, {
    period,
    hubId,
    hubName: hubName || resolvedHubLabel({ hubId }),
    winners,
  });

  return {
    period,
    hubId,
    hubName: hubName || resolvedHubLabel({ hubId }),
    winners,
    computedAt: new Date(),
  };
}
