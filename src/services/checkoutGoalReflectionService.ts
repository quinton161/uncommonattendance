import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import type { CheckoutGoalReflectionPayload } from '../types/checkoutGoalReflection';

export async function saveCheckoutGoalReflection(
  userId: string,
  harareDate: string,
  payload: CheckoutGoalReflectionPayload,
  isFriday: boolean
): Promise<void> {
  await convex.mutation(api.checkoutReflections.save as any, {
    userId: userId as any,
    date: harareDate,
    dailyAchieved: payload.dailyAchieved,
    dailyNote: payload.dailyNote.trim(),
    isFriday,
    weeklyAchieved: isFriday ? payload.weeklyAchieved : null,
    weeklyReflection: isFriday ? payload.weeklyReflection.trim() : '',
  });
}
