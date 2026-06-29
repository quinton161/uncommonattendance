import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import type { DailyGoal, GoalStatus, WeeklyGoal } from '../types/studentGoals';
import { TimeService } from './timeService';

function mapWeekly(d: any): WeeklyGoal {
  return {
    id: d._id,
    title: String(d.title ?? ''),
    description: String(d.description ?? ''),
    weekStart: String(d.weekStart ?? ''),
    weekEnd: String(d.weekEnd ?? ''),
    status: (d.status as GoalStatus) || 'pending',
    createdAt: d.createdAt ? new Date(d.createdAt) : null,
  };
}

function mapDaily(d: any): DailyGoal {
  return {
    id: d._id,
    title: String(d.title ?? ''),
    description: String(d.description ?? ''),
    date: String(d.date ?? ''),
    status: (d.status as GoalStatus) || 'pending',
  };
}

export async function hasAnyWeeklyGoals(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    return await convex.query(api.weeklyGoals.hasAny as any, { userId: userId as any });
  } catch {
    return false;
  }
}

export async function hasAnyDailyGoal(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    return await convex.query(api.dailyGoals.hasAnyForUser as any, { userId: userId as any });
  } catch {
    return false;
  }
}

export async function hasGoalsForCheckoutReflection(userId: string): Promise<boolean> {
  if (!userId) return false;
  if (await hasAnyDailyGoal(userId)) return true;
  return hasAnyWeeklyGoals(userId);
}

export function subscribeWeeklyGoals(
  userId: string,
  onData: (goals: WeeklyGoal[], err: Error | null) => void
): () => void {
  const fetchAndNotify = async () => {
    try {
      const list = await convex.query(api.weeklyGoals.list as any, { userId: userId as any }) as any[];
      onData((list || []).map(mapWeekly), null);
    } catch (e) {
      onData([], e instanceof Error ? e : new Error(String(e)));
    }
  };

  fetchAndNotify();
  const interval = setInterval(fetchAndNotify, 15000);
  return () => clearInterval(interval);
}

export function subscribeDailyGoals(
  userId: string,
  weeklyGoalId: string,
  onData: (goals: DailyGoal[], err: Error | null) => void
): () => void {
  const fetchAndNotify = async () => {
    try {
      const list = await convex.query(api.dailyGoals.list as any, { weeklyGoalId: weeklyGoalId as any }) as any[];
      onData((list || []).map(mapDaily), null);
    } catch (e) {
      onData([], e instanceof Error ? e : new Error(String(e)));
    }
  };

  fetchAndNotify();
  const interval = setInterval(fetchAndNotify, 15000);
  return () => clearInterval(interval);
}

export async function addWeeklyGoal(
  userId: string,
  payload: Omit<WeeklyGoal, 'id' | 'createdAt'>
): Promise<string> {
  return await convex.mutation(api.weeklyGoals.add as any, {
    userId: userId as any,
    title: payload.title.trim(),
    description: payload.description.trim(),
    weekStart: payload.weekStart,
    weekEnd: payload.weekEnd,
    status: payload.status,
  });
}

export async function updateWeeklyGoal(
  userId: string,
  weeklyGoalId: string,
  patch: Partial<Pick<WeeklyGoal, 'title' | 'description' | 'weekStart' | 'weekEnd' | 'status'>>
): Promise<void> {
  const updates: Record<string, any> = {};
  if (patch.title !== undefined) updates.title = patch.title.trim();
  if (patch.description !== undefined) updates.description = patch.description.trim();
  if (patch.weekStart !== undefined) updates.weekStart = patch.weekStart;
  if (patch.weekEnd !== undefined) updates.weekEnd = patch.weekEnd;
  if (patch.status !== undefined) updates.status = patch.status;
  await convex.mutation(api.weeklyGoals.update as any, { goalId: weeklyGoalId as any, ...updates });
}

export async function deleteWeeklyGoalCascade(userId: string, weeklyGoalId: string): Promise<void> {
  await convex.mutation(api.weeklyGoals.remove as any, { goalId: weeklyGoalId as any });
}

export async function addDailyGoal(
  userId: string,
  weeklyGoalId: string,
  payload: Omit<DailyGoal, 'id'>
): Promise<string> {
  return await convex.mutation(api.dailyGoals.add as any, {
    weeklyGoalId: weeklyGoalId as any,
    userId: userId as any,
    title: payload.title.trim(),
    description: payload.description.trim(),
    date: payload.date,
    status: payload.status,
  });
}

export async function updateDailyGoal(
  userId: string,
  weeklyGoalId: string,
  dailyGoalId: string,
  patch: Partial<Pick<DailyGoal, 'title' | 'description' | 'date' | 'status'>>
): Promise<void> {
  const updates: Record<string, any> = {};
  if (patch.title !== undefined) updates.title = patch.title.trim();
  if (patch.description !== undefined) updates.description = patch.description.trim();
  if (patch.date !== undefined) updates.date = patch.date;
  if (patch.status !== undefined) updates.status = patch.status;
  await convex.mutation(api.dailyGoals.update as any, { goalId: dailyGoalId as any, ...updates });
}

export async function deleteDailyGoal(
  userId: string,
  weeklyGoalId: string,
  dailyGoalId: string
): Promise<void> {
  await convex.mutation(api.dailyGoals.remove as any, { goalId: dailyGoalId as any });
}

export function computeWeeklyProgress(weekly: WeeklyGoal, dailies: DailyGoal[]): number {
  if (dailies.length > 0) {
    const done = dailies.filter((d) => d.status === 'completed').length;
    return Math.round((done / dailies.length) * 100);
  }
  switch (weekly.status) {
    case 'completed': return 100;
    case 'in_progress': return 50;
    default: return 0;
  }
}

export function sortDailiesByDate(dailies: DailyGoal[]): DailyGoal[] {
  return [...dailies].sort((a, b) => a.date.localeCompare(b.date));
}

export const DAILY_GOAL_CHECKIN_MIN_TITLE_LEN = 3;

const CHECKIN_DAILY_DESC = 'Synced from check-in';

export async function getTodayDailyGoalTitleForCheckIn(
  userId: string,
  dateStr?: string
): Promise<string | undefined> {
  const date = dateStr?.trim() || TimeService.getInstance().getCurrentDateString();
  if (!userId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;

  try {
    const dailies = await convex.query(api.dailyGoals.getByDate as any, {
      userId: userId as any,
      date,
    }) as any[];
    for (const d of dailies || []) {
      const title = String(d.title ?? '').trim();
      if (title.length >= DAILY_GOAL_CHECKIN_MIN_TITLE_LEN) return title;
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[studentGoalsService] getTodayDailyGoalTitleForCheckIn failed', e);
    }
  }
  return undefined;
}

export async function upsertDailyGoalFromCheckIn(
  userId: string,
  goalText: string,
  dateStr: string
): Promise<void> {
  const trimmed = goalText.trim();
  if (!userId || !trimmed || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;

  const weeks = await convex.query(api.weeklyGoals.list as any, { userId: userId as any }) as any[];
  let weeklyGoalId: string | null = null;
  let bestWeekStart = '';
  for (const w of weeks || []) {
    const ws = String(w.weekStart || '');
    const we = String(w.weekEnd || '');
    if (ws && we && dateStr >= ws && dateStr <= we) {
      if (!weeklyGoalId || ws > bestWeekStart) {
        weeklyGoalId = w._id;
        bestWeekStart = ws;
      }
    }
  }

  if (!weeklyGoalId) {
    const { weekStart, weekEnd } = TimeService.getInstance().getHarareWeekMondaySundayBounds(dateStr);
    weeklyGoalId = await addWeeklyGoal(userId, {
      title: `Week ${weekStart} → ${weekEnd}`,
      description: 'Created automatically from your check-in goal. You can rename this week or add more daily goals anytime.',
      weekStart,
      weekEnd,
      status: 'in_progress',
    });
  }

  const existing = await convex.query(api.dailyGoals.getByDate as any, {
    userId: userId as any,
    date: dateStr,
  }) as any[];

  if (existing && existing.length > 0) {
    const first = existing[0];
    await updateDailyGoal(userId, weeklyGoalId, first._id, {
      title: trimmed,
      description: CHECKIN_DAILY_DESC,
      status: 'in_progress',
    });
    return;
  }

  await addDailyGoal(userId, weeklyGoalId, {
    title: trimmed,
    description: CHECKIN_DAILY_DESC,
    date: dateStr,
    status: 'in_progress',
  });
}
