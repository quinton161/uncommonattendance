import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { CheckoutGoalReflectionPayload } from '../types/checkoutGoalReflection';

/** One doc per Harare calendar day: `users/{uid}/checkoutGoalLogs/{yyyy-mm-dd}` */
export async function saveCheckoutGoalReflection(
  userId: string,
  harareDate: string,
  payload: CheckoutGoalReflectionPayload,
  isFriday: boolean
): Promise<void> {
  const ref = doc(db, 'users', userId, 'checkoutGoalLogs', harareDate);
  await setDoc(
    ref,
    {
      date: harareDate,
      dailyAchieved: payload.dailyAchieved,
      dailyNote: payload.dailyNote.trim(),
      isFriday,
      weeklyAchieved: isFriday ? payload.weeklyAchieved : null,
      weeklyReflection: isFriday ? payload.weeklyReflection.trim() : '',
      savedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
