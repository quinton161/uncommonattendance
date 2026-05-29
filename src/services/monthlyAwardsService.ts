import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { MonthlyAwardDoc, MonthlyAwardWinner } from '../types/notifications';
import { resolvedHubLabel } from './hubService';
import {
  attendanceAnalyticsService,
  type DateRange,
} from './attendanceAnalyticsService';

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
  let snap;
  try {
    snap = await getDoc(doc(db, 'monthly_awards', monthlyAwardDocId(period, hubId)));
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[monthlyAwardsService] getMonthlyAward failed', e);
    }
    return null;
  }
  if (!snap.exists()) return null;
  const data = snap.data();
  const computed = data.computedAt as { toDate?: () => Date } | undefined;
  return {
    period: String(data.period || period),
    hubId: String(data.hubId || hubId),
    hubName: String(data.hubName || resolvedHubLabel({ hubId })),
    winners: (data.winners as MonthlyAwardWinner[]) || [],
    computedAt: computed?.toDate?.() ?? new Date(),
  };
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

  const payload = {
    period,
    hubId,
    hubName: hubName || resolvedHubLabel({ hubId }),
    winners,
    computedAt: serverTimestamp(),
  };

  const id = monthlyAwardDocId(period, hubId);
  await setDoc(doc(db, 'monthly_awards', id), payload);

  return {
    period,
    hubId,
    hubName: payload.hubName,
    winners,
    computedAt: new Date(),
  };
}
