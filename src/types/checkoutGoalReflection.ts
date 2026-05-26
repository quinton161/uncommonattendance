export type GoalCheckChoice = 'yes' | 'no' | 'skip';

export interface CheckoutGoalReflectionPayload {
  dailyAchieved: GoalCheckChoice;
  dailyNote: string;
  weeklyAchieved: GoalCheckChoice;
  weeklyReflection: string;
}
