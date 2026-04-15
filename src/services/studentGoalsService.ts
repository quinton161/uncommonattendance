import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import type { DailyGoal, GoalStatus, WeeklyGoal } from '../types/studentGoals';

function weeklyCol(userId: string) {
  return collection(db, 'users', userId, 'weeklyGoals');
}

function dailyCol(userId: string, weeklyGoalId: string) {
  return collection(db, 'users', userId, 'weeklyGoals', weeklyGoalId, 'dailyGoals');
}

function mapWeekly(id: string, data: Record<string, unknown>): WeeklyGoal {
  const created = data.createdAt as { toDate?: () => Date } | undefined;
  return {
    id,
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    weekStart: String(data.weekStart ?? ''),
    weekEnd: String(data.weekEnd ?? ''),
    status: (data.status as GoalStatus) || 'pending',
    createdAt: created?.toDate ? created.toDate() : null,
  };
}

function mapDaily(id: string, data: Record<string, unknown>): DailyGoal {
  return {
    id,
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    date: String(data.date ?? ''),
    status: (data.status as GoalStatus) || 'pending',
  };
}

export function subscribeWeeklyGoals(
  userId: string,
  onData: (goals: WeeklyGoal[], err: Error | null) => void
): () => void {
  const q = query(weeklyCol(userId), orderBy('weekStart', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapWeekly(d.id, d.data() as Record<string, unknown>));
      onData(list, null);
    },
    (e) => onData([], e instanceof Error ? e : new Error(String(e)))
  );
}

export function subscribeDailyGoals(
  userId: string,
  weeklyGoalId: string,
  onData: (goals: DailyGoal[], err: Error | null) => void
): () => void {
  const q = query(dailyCol(userId, weeklyGoalId), orderBy('date', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapDaily(d.id, d.data() as Record<string, unknown>));
      onData(list, null);
    },
    (e) => onData([], e instanceof Error ? e : new Error(String(e)))
  );
}

export async function addWeeklyGoal(
  userId: string,
  payload: Omit<WeeklyGoal, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(weeklyCol(userId), {
    title: payload.title.trim(),
    description: payload.description.trim(),
    weekStart: payload.weekStart,
    weekEnd: payload.weekEnd,
    status: payload.status,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateWeeklyGoal(
  userId: string,
  weeklyGoalId: string,
  patch: Partial<Pick<WeeklyGoal, 'title' | 'description' | 'weekStart' | 'weekEnd' | 'status'>>
): Promise<void> {
  const r: DocumentData = {};
  if (patch.title !== undefined) r.title = patch.title.trim();
  if (patch.description !== undefined) r.description = patch.description.trim();
  if (patch.weekStart !== undefined) r.weekStart = patch.weekStart;
  if (patch.weekEnd !== undefined) r.weekEnd = patch.weekEnd;
  if (patch.status !== undefined) r.status = patch.status;
  await updateDoc(doc(db, 'users', userId, 'weeklyGoals', weeklyGoalId), r);
}

/** Deletes all daily goals under the week, then the weekly doc */
export async function deleteWeeklyGoalCascade(userId: string, weeklyGoalId: string): Promise<void> {
  const dSnap = await getDocs(dailyCol(userId, weeklyGoalId));
  const batch = writeBatch(db);
  dSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, 'users', userId, 'weeklyGoals', weeklyGoalId));
  await batch.commit();
}

export async function addDailyGoal(
  userId: string,
  weeklyGoalId: string,
  payload: Omit<DailyGoal, 'id'>
): Promise<string> {
  const ref = await addDoc(dailyCol(userId, weeklyGoalId), {
    title: payload.title.trim(),
    description: payload.description.trim(),
    date: payload.date,
    status: payload.status,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDailyGoal(
  userId: string,
  weeklyGoalId: string,
  dailyGoalId: string,
  patch: Partial<Pick<DailyGoal, 'title' | 'description' | 'date' | 'status'>>
): Promise<void> {
  const r: DocumentData = {};
  if (patch.title !== undefined) r.title = patch.title.trim();
  if (patch.description !== undefined) r.description = patch.description.trim();
  if (patch.date !== undefined) r.date = patch.date;
  if (patch.status !== undefined) r.status = patch.status;
  await updateDoc(doc(db, 'users', userId, 'weeklyGoals', weeklyGoalId, 'dailyGoals', dailyGoalId), r);
}

export async function deleteDailyGoal(
  userId: string,
  weeklyGoalId: string,
  dailyGoalId: string
): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'weeklyGoals', weeklyGoalId, 'dailyGoals', dailyGoalId));
}

/** Progress 0–100 from daily completion; if no dailies, infer from weekly status */
export function computeWeeklyProgress(weekly: WeeklyGoal, dailies: DailyGoal[]): number {
  if (dailies.length > 0) {
    const done = dailies.filter((d) => d.status === 'completed').length;
    return Math.round((done / dailies.length) * 100);
  }
  switch (weekly.status) {
    case 'completed':
      return 100;
    case 'in_progress':
      return 50;
    default:
      return 0;
  }
}

export function sortDailiesByDate(dailies: DailyGoal[]): DailyGoal[] {
  return [...dailies].sort((a, b) => a.date.localeCompare(b.date));
}
