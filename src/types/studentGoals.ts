/** Scrum-style goals stored under `users/{userId}/weeklyGoals` + `dailyGoals` subcollection */

export type GoalStatus = 'pending' | 'in_progress' | 'completed';

export interface WeeklyGoal {
  id: string;
  title: string;
  description: string;
  weekStart: string;
  weekEnd: string;
  status: GoalStatus;
  createdAt: Date | null;
}

export interface DailyGoal {
  id: string;
  title: string;
  description: string;
  date: string;
  status: GoalStatus;
}

export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};
